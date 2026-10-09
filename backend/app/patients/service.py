import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.database import Patient, User, TestRequest, Conflict
from backend.app.patients.repository import PatientRepository
from backend.app.schemas.patient import PatientResponse, PatientBrief

class PatientService:
    @staticmethod
    def get_patient_directory(db: Session, current_user: User) -> List[PatientResponse]:
        all_patients = PatientRepository.list_all(db)
        authorized_ids = set()
        
        if current_user.role == "admin":
            authorized_ids = {p.id for p in all_patients}
        else:
            authorized_ids = {p.id for p in PatientRepository.list_authorized(db, current_user.id)}
            
        results = []
        for p in all_patients:
            has_grant = p.id in authorized_ids
            results.append(PatientResponse(
                id=p.id,
                name=p.name,
                date_of_birth=p.date_of_birth,
                gender=p.gender,
                mrn=p.mrn,
                metadata_json=p.metadata_json,
                created_at=p.created_at,
                has_grant=has_grant,
                permissions=["read", "write", "query", "reconcile"] if has_grant else []
            ))
        return results

    @staticmethod
    def get_patient_brief(db: Session, patient_id: str) -> Optional[PatientBrief]:
        patient = PatientRepository.get_by_id(db, patient_id)
        if not patient:
            return None
            
        docs = PatientRepository.get_documents(db, patient_id)
        events = PatientRepository.get_events(db, patient_id)
        pending_tests = db.query(TestRequest).filter(
            TestRequest.patient_id == patient_id,
            TestRequest.status.in_(["pending", "recorded_pending", "result_not_found", "needs_review"])
        ).count()
        
        unresolved_conflicts = db.query(Conflict).filter(
            Conflict.patient_id == patient_id,
            Conflict.status == "Needs Review"
        ).count()
        
        cycles = list(set([d.cycle_label for d in docs if d.cycle_label] + [e.cycle_label for e in events if e.cycle_label]))
        cycles.sort()
        
        recent_events = [
            {
                "id": e.id,
                "event_type": e.event_type,
                "event_date": e.event_date,
                "description": e.description,
                "cycle_label": e.cycle_label,
                "source_page": e.source_page
            }
            for e in events[-5:]
        ]
        
        return PatientBrief(
            patient=PatientResponse(
                id=patient.id,
                name=patient.name,
                date_of_birth=patient.date_of_birth,
                gender=patient.gender,
                mrn=patient.mrn,
                metadata_json=patient.metadata_json,
                created_at=patient.created_at,
                has_grant=True,
                permissions=["read", "write", "query", "reconcile"]
            ),
            total_documents=len(docs),
            total_events=len(events),
            pending_tests_count=pending_tests,
            unresolved_conflicts_count=unresolved_conflicts,
            active_cycles=cycles,
            recent_events=recent_events
        )
