import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.core.database import Document, Event, TestRequest, TestResult, Conflict

def process_document_versioning(
    db: Session,
    patient_id: str,
    new_doc_id: str,
    new_doc_name: str,
    extracted_facts: Dict[str, Any],
    cycle_label: str = "Cycle 2"
) -> Dict[str, Any]:
    """
    Compares newly extracted facts against existing patient history.
    Produces a Change Summary without silently rewriting history:
    - New Facts
    - Changed Facts / Discrepancies (Conflicts)
    - Newly Matched Test Results
    """
    existing_events = db.query(Event).filter(Event.patient_id == patient_id).all()
    existing_requests = db.query(TestRequest).filter(TestRequest.patient_id == patient_id).all()
    existing_results = db.query(TestResult).filter(TestResult.patient_id == patient_id).all()
    
    new_facts = []
    changed_facts = []
    matched_results = []
    conflicts_detected = []
    
    # 1. Analyze Events and detect date/procedure discrepancies
    for new_ev in extracted_facts.get("events", []):
        matched_existing = False
        for ex_ev in existing_events:
            # If same event type in same cycle or related topic but dates differ
            if ex_ev.event_type == new_ev["event_type"] and ex_ev.event_type == "Procedure":
                if ex_ev.event_date != new_ev["event_date"]:
                    conflict_id = f"CONF-{patient_id}-{uuid.uuid4().hex[:6]}"
                    conf = {
                        "id": conflict_id,
                        "patient_id": patient_id,
                        "cycle_label": cycle_label,
                        "conflict_type": "Procedure Date Discrepancy",
                        "fact_a": f"Procedure date: {ex_ev.event_date} ({ex_ev.description})",
                        "fact_b": f"Procedure date: {new_ev['event_date']} ({new_ev['description']})",
                        "source_a_doc": ex_ev.document_id or "prior_consultation.pdf",
                        "source_a_page": ex_ev.source_page or 1,
                        "source_b_doc": new_doc_name,
                        "source_b_page": new_ev["source_page"],
                        "status": "Needs Review"
                    }
                    conflicts_detected.append(conf)
                    changed_facts.append(f"Procedure date differs: prior record had {ex_ev.event_date}, new report states {new_ev['event_date']}")
                    matched_existing = True
                    break
        if not matched_existing:
            new_facts.append(f"New event: {new_ev['event_type']} on {new_ev['event_date']} ({new_ev['description']})")
            
    # 2. Analyze Test Results and match with pending requests
    for new_res in extracted_facts.get("test_results", []):
        matched_req = None
        for req in existing_requests:
            if req.test_name.lower() in new_res["test_name"].lower() or new_res["test_name"].lower() in req.test_name.lower():
                matched_req = req
                break
                
        if matched_req:
            matched_results.append({
                "test_name": matched_req.test_name,
                "request_id": matched_req.id,
                "requested_date": matched_req.requested_date,
                "result_date": new_res["result_date"],
                "result_data": new_res["result_data"],
                "status": "Matched"
            })
            new_facts.append(f"✓ Matched test result for '{matched_req.test_name}' requested on {matched_req.requested_date}")
        else:
            new_facts.append(f"New test result: {new_res['test_name']} ({new_res['result_data']})")
            
    return {
        "new_facts": new_facts,
        "changed_facts": changed_facts,
        "matched_results": matched_results,
        "conflicts_detected": conflicts_detected,
        "summary_text": f"Extracted {len(new_facts)} new facts, {len(changed_facts)} discrepancies/conflicts, and matched {len(matched_results)} pending tests."
    }
