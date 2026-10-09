from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.core.database import Event, TestRequest, TestResult, Conflict

class StructuredFactsSearch:
    @staticmethod
    def get_patient_structured_facts(db: Session, patient_id: str) -> Dict[str, Any]:
        """
        Retrieves all authorized structured facts for patient:
        - events timeline
        - test requests
        - test results
        - conflicts
        """
        events = db.query(Event).filter(Event.patient_id == patient_id).order_by(Event.event_date.asc()).all()
        requests = db.query(TestRequest).filter(TestRequest.patient_id == patient_id).all()
        results = db.query(TestResult).filter(TestResult.patient_id == patient_id).all()
        conflicts = db.query(Conflict).filter(Conflict.patient_id == patient_id).all()
        
        return {
            "events": [
                {
                    "id": e.id,
                    "event_type": e.event_type,
                    "event_date": e.event_date,
                    "description": e.description,
                    "cycle_label": e.cycle_label,
                    "source_page": e.source_page
                } for e in events
            ],
            "test_requests": [
                {
                    "id": r.id,
                    "test_name": r.test_name,
                    "requested_date": r.requested_date,
                    "status": r.status,
                    "requesting_physician": r.requesting_physician,
                    "cycle_label": r.cycle_label
                } for r in requests
            ],
            "test_results": [
                {
                    "id": res.id,
                    "test_name": res.test_name,
                    "result_date": res.result_date,
                    "result_data": res.result_data,
                    "reference_range": res.reference_range,
                    "is_abnormal": res.is_abnormal,
                    "cycle_label": res.cycle_label
                } for res in results
            ],
            "conflicts": [
                {
                    "id": c.id,
                    "conflict_type": c.conflict_type,
                    "fact_a": c.fact_a,
                    "fact_b": c.fact_b,
                    "source_a_doc": c.source_a_doc,
                    "source_a_page": c.source_a_page,
                    "source_b_doc": c.source_b_doc,
                    "source_b_page": c.source_b_page,
                    "status": c.status
                } for c in conflicts
            ]
        }
