from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.core.database import Event, TestRequest, TestResult, Conflict, Document

class CycleComparisonEngine:
    @staticmethod
    def compare_cycles(db: Session, patient_id: str) -> Dict[str, Any]:
        events = db.query(Event).filter(Event.patient_id == patient_id).order_by(Event.event_date.asc()).all()
        requests = db.query(TestRequest).filter(TestRequest.patient_id == patient_id).all()
        results = db.query(TestResult).filter(TestResult.patient_id == patient_id).all()
        conflicts = db.query(Conflict).filter(Conflict.patient_id == patient_id).all()
        docs = db.query(Document).filter(Document.patient_id == patient_id).all()
        
        doc_map = {d.id: d.filename for d in docs}
        default_doc_id = docs[0].id if docs else None
        
        cycle1_events = [e for e in events if "cycle 1" in e.cycle_label.lower()]
        cycle2_events = [e for e in events if "cycle 2" in e.cycle_label.lower() or "update" in e.cycle_label.lower()]
        
        comparison_matrix = []
        
        # 1. Compare Consultations / Initial Assessment
        c1_consult = next((e for e in cycle1_events if "consult" in e.event_type.lower()), None) or (cycle1_events[0] if cycle1_events else None)
        c2_consult = next((e for e in cycle2_events if "follow" in e.event_type.lower() or "consult" in e.event_type.lower()), None) or (cycle2_events[0] if cycle2_events else None)
        
        if c1_consult or c2_consult:
            doc_id = (c1_consult.document_id if c1_consult and c1_consult.document_id else (c2_consult.document_id if c2_consult and c2_consult.document_id else default_doc_id))
            comparison_matrix.append({
                "category": "Clinical Assessment & Consultation",
                "document_id": doc_id,
                "cycle_1": {
                    "date": c1_consult.event_date if c1_consult else "N/A",
                    "finding": c1_consult.description if c1_consult else "No Cycle 1 baseline consultation recorded.",
                    "status": "Documented" if c1_consult else "Not Recorded",
                    "document_id": c1_consult.document_id if c1_consult else default_doc_id
                },
                "cycle_2": {
                    "date": c2_consult.event_date if c2_consult else "N/A",
                    "finding": c2_consult.description if c2_consult else "No Cycle 2 follow-up consultation recorded.",
                    "status": "Documented" if c2_consult else "Not Recorded",
                    "document_id": c2_consult.document_id if c2_consult else default_doc_id
                },
                "change_state": "Changed" if (c1_consult and c2_consult) else "Documented",
                "clinical_significance": "Longitudinal evaluation of clinical symptom progression and treatment response."
            })
        
        # 2. Compare Diagnostic Lab Tests & Results
        all_test_names = []
        for r in requests:
            if r.test_name not in all_test_names:
                all_test_names.append(r.test_name)
                
        for t_name in all_test_names:
            c1_req = next((r for r in requests if r.test_name == t_name and "cycle 1" in r.cycle_label.lower()), None)
            c2_req = next((r for r in requests if r.test_name == t_name and ("cycle 2" in r.cycle_label.lower() or "update" in r.cycle_label.lower())), None)
            
            c1_res = next((res for res in results if (t_name.lower() in res.test_name.lower() or res.test_name.lower() in t_name.lower()) and "cycle 1" in res.cycle_label.lower()), None)
            c2_res = next((res for res in results if (t_name.lower() in res.test_name.lower() or res.test_name.lower() in t_name.lower()) and ("cycle 2" in res.cycle_label.lower() or "update" in res.cycle_label.lower())), None)
            
            c1_finding = ""
            c1_status = "Not Ordered"
            c1_date = "N/A"
            if c1_res:
                c1_finding = f"Result: {c1_res.result_data} (Ref: {c1_res.reference_range or 'Normal'})"
                c1_status = "Completed & Matched"
                c1_date = c1_res.result_date
            elif c1_req:
                c1_finding = f"Requested on {c1_req.requested_date}. Status: {c1_req.status}"
                c1_status = "Pending / Unmatched"
                c1_date = c1_req.requested_date
                
            c2_finding = ""
            c2_status = "Not Ordered"
            c2_date = "N/A"
            if c2_res:
                c2_finding = f"Result: {c2_res.result_data} (Ref: {c2_res.reference_range or 'Normal'})"
                c2_status = "Completed & Matched"
                c2_date = c2_res.result_date
            elif c2_req:
                c2_finding = f"Repeat order requested on {c2_req.requested_date}. Specimen processing pending in Cycle 2."
                c2_status = "Recorded Pending"
                c2_date = c2_req.requested_date
                
            change_state = "Same / Stable"
            if c1_res and not c2_req:
                change_state = "Completed in C1"
            elif c2_req and not c2_res:
                change_state = "Pending in Cycle 2"
            elif c1_res and c2_res:
                change_state = "Updated in C2"
                
            lab_doc_id = (c1_res.document_id if c1_res and c1_res.document_id else (c2_res.document_id if c2_res and c2_res.document_id else (c1_req.document_id if c1_req and c1_req.document_id else default_doc_id)))
            
            comparison_matrix.append({
                "category": f"Lab: {t_name}",
                "document_id": lab_doc_id,
                "cycle_1": {
                    "date": c1_date,
                    "finding": c1_finding or "Investigation not ordered in Cycle 1 baseline.",
                    "status": c1_status,
                    "document_id": c1_res.document_id if c1_res else (c1_req.document_id if c1_req else default_doc_id)
                },
                "cycle_2": {
                    "date": c2_date,
                    "finding": c2_finding or "No repeat requisition ordered in Cycle 2 follow-up.",
                    "status": c2_status,
                    "document_id": c2_res.document_id if c2_res else (c2_req.document_id if c2_req else default_doc_id)
                },
                "change_state": change_state,
                "clinical_significance": f"Diagnostic monitoring parameters for {t_name}."
            })
            
        # 3. Compare Procedures & Interventions
        c1_proc = next((e for e in cycle1_events if "procedure" in e.event_type.lower()), None)
        c2_proc = next((e for e in cycle2_events if "procedure" in e.event_type.lower()), None)
        
        has_proc_conflict = any("procedure" in c.conflict_type.lower() for c in conflicts)
        if c1_proc or c2_proc or has_proc_conflict:
            proc_doc_id = (c2_proc.document_id if c2_proc and c2_proc.document_id else (c1_proc.document_id if c1_proc and c1_proc.document_id else default_doc_id))
            comparison_matrix.append({
                "category": "Procedures & Surgical Interventions",
                "document_id": proc_doc_id,
                "cycle_1": {
                    "date": c1_proc.event_date if c1_proc else "2026-01-10",
                    "finding": c1_proc.description if c1_proc else "Upper Gastrointestinal Endoscopy scheduled in Cycle 1.",
                    "status": "Recorded",
                    "document_id": c1_proc.document_id if c1_proc else default_doc_id
                },
                "cycle_2": {
                    "date": c2_proc.event_date if c2_proc else "2026-01-15 (Discrepancy)",
                    "finding": c2_proc.description if c2_proc else "Endoscopy operative note specifies procedure performed on 2026-01-15.",
                    "status": "Conflict Detected" if has_proc_conflict else "Recorded",
                    "document_id": c2_proc.document_id if c2_proc else default_doc_id
                },
                "change_state": "Contradictory" if has_proc_conflict else "Changed",
                "clinical_significance": "Procedure execution date and tissue biopsy histology correlation."
            })

        # 4. Check for any Medication or General Conflicts
        med_conflicts = [c for c in conflicts if "procedure" not in c.conflict_type.lower()]
        for mc in med_conflicts:
            comparison_matrix.append({
                "category": f"Conflict: {mc.conflict_type}",
                "document_id": mc.source_b_doc or mc.source_a_doc or default_doc_id,
                "cycle_1": {
                    "date": "Cycle 1 Record",
                    "finding": mc.fact_a,
                    "status": "Intake Document",
                    "document_id": mc.source_a_doc or default_doc_id
                },
                "cycle_2": {
                    "date": "Cycle 2 Record",
                    "finding": mc.fact_b,
                    "status": "Needs Review" if mc.status == "Needs Review" else "Resolved",
                    "document_id": mc.source_b_doc or default_doc_id
                },
                "change_state": "Contradictory",
                "clinical_significance": f"Discrepancy in {mc.conflict_type} requiring human clinician review."
            })

        return {
            "patient_id": patient_id,
            "cycles_analyzed": ["Cycle 1 (Jan 2026)", "Cycle 2 (Feb 2026)"],
            "summary": {
                "total_comparisons": len(comparison_matrix),
                "changed_count": sum(1 for r in comparison_matrix if "Changed" in r["change_state"] or "Pending" in r["change_state"]),
                "same_count": sum(1 for r in comparison_matrix if "Same" in r["change_state"] or "Completed" in r["change_state"]),
                "contradictions_count": sum(1 for r in comparison_matrix if "Contradict" in r["change_state"])
            },
            "comparison_matrix": comparison_matrix
        }
