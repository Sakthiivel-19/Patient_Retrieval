from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.core.database import Conflict, AuditEvent
from backend.app.schemas.conflict import ConflictResponse, ConflictReviewRequest

class ConflictDetectionService:
    @staticmethod
    def list_conflicts(db: Session, patient_id: str) -> List[ConflictResponse]:
        conflicts = db.query(Conflict).filter(Conflict.patient_id == patient_id).order_by(Conflict.created_at.desc()).all()
        return [
            ConflictResponse(
                id=c.id,
                patient_id=c.patient_id,
                cycle_label=c.cycle_label,
                conflict_type=c.conflict_type,
                fact_a=c.fact_a,
                fact_b=c.fact_b,
                source_a_doc=c.source_a_doc,
                source_a_page=c.source_a_page,
                source_b_doc=c.source_b_doc,
                source_b_page=c.source_b_page,
                status=c.status,
                reviewed_by=c.reviewed_by,
                resolution_note=c.resolution_note,
                created_at=c.created_at
            ) for c in conflicts
        ]

    @staticmethod
    def review_conflict(
        db: Session,
        patient_id: str,
        conflict_id: str,
        req: ConflictReviewRequest,
        reviewer_name: str
    ) -> Optional[ConflictResponse]:
        conf = db.query(Conflict).filter(Conflict.id == conflict_id, Conflict.patient_id == patient_id).first()
        if not conf:
            return None
            
        conf.status = req.status
        conf.reviewed_by = reviewer_name
        conf.resolution_note = req.resolution_note
        
        # Log audit event for conflict resolution
        audit = AuditEvent(
            patient_id=patient_id,
            action="CONFLICT_REVIEW",
            resource=f"/conflicts/{conflict_id}",
            metadata_json=f'{{"resolution": "{req.status}", "reviewer": "{reviewer_name}", "note": "{req.resolution_note}"}}'
        )
        db.add(audit)
        db.commit()
        db.refresh(conf)
        
        return ConflictResponse.model_validate(conf)
