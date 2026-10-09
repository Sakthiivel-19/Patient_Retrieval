from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.database import TestRequest, TestResult, Document
from backend.app.schemas.test import ReconciliationItem, ReconciliationSummary

class TestMatchingEngine:
    @staticmethod
    def compute_reconciliation(db: Session, patient_id: str) -> ReconciliationSummary:
        """
        Reconciles test requests against available lab results.
        Status taxonomy:
        - 'Matched': Corresponding verified result found
        - 'Recorded Pending': Test requested recently / pending lab fulfillment
        - 'Result not found': Request exists, completed cycle passed, no result in records
        - 'Needs review': Potential partial match or ambiguous result evidence
        """
        requests = db.query(TestRequest).filter(TestRequest.patient_id == patient_id).all()
        results = db.query(TestResult).filter(TestResult.patient_id == patient_id).all()
        
        # Build document lookup map
        doc_map = {d.id: d.filename for d in db.query(Document).filter(Document.patient_id == patient_id).all()}
        
        items = []
        matched_cnt = 0
        pending_cnt = 0
        missing_cnt = 0
        review_cnt = 0
        
        for req in requests:
            # Find best candidate result
            matched_res = None
            req_name_clean = req.test_name.lower()
            
            for res in results:
                res_name_clean = res.test_name.lower()
                if req_name_clean in res_name_clean or res_name_clean in req_name_clean:
                    matched_res = res
                    break
                    
            if matched_res:
                status = "Matched"
                matched_cnt += 1
                evidence_text = f"Result received on {matched_res.result_date}: {matched_res.result_data}"
                result_id = matched_res.id
                result_date = matched_res.result_date
                result_data = matched_res.result_data
                result_doc = doc_map.get(matched_res.document_id, "lab_report.pdf")
                result_doc_id = matched_res.document_id
                reference_range = matched_res.reference_range
                is_abnormal = matched_res.is_abnormal
            else:
                if req.status == "recorded_pending" or "cycle 2" in req.cycle_label.lower():
                    status = "Recorded Pending"
                    pending_cnt += 1
                    evidence_text = "Test order confirmed. Specimen processing pending in Cycle 2."
                elif req.status == "needs_review":
                    status = "Needs review"
                    review_cnt += 1
                    evidence_text = "Ambiguous test requisition requires clinical verification."
                else:
                    status = "Result not found"
                    missing_cnt += 1
                    evidence_text = "Investigation ordered in consultation, but no corresponding lab report exists in patient records."
                    
                result_id = None
                result_date = None
                result_data = None
                result_doc = None
                result_doc_id = None
                reference_range = None
                is_abnormal = False
                
            items.append(ReconciliationItem(
                request_id=req.id,
                test_name=req.test_name,
                requested_date=req.requested_date,
                status=status,
                request_document=doc_map.get(req.document_id, "consultation_note.pdf"),
                request_doc_id=req.document_id,
                result_id=result_id,
                result_date=result_date,
                result_data=result_data,
                result_document=result_doc,
                result_doc_id=result_doc_id,
                reference_range=reference_range,
                is_abnormal=is_abnormal,
                evidence=evidence_text,
                cycle_label=req.cycle_label
            ))
            
        return ReconciliationSummary(
            patient_id=patient_id,
            total_requested=len(requests),
            matched_count=matched_cnt,
            pending_count=pending_cnt,
            missing_count=missing_cnt,
            needs_review_count=review_cnt,
            items=items
        )
