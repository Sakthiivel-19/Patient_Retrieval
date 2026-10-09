from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.core.database import AuditEvent, User
from backend.app.audit.schemas import AuditEventResponse

class AuditService:
    @staticmethod
    def get_events(
        db: Session,
        patient_id: Optional[str] = None,
        user_id: Optional[int] = None,
        limit: int = 100
    ) -> List[AuditEventResponse]:
        query = db.query(AuditEvent)
        if patient_id:
            query = query.filter(AuditEvent.patient_id == patient_id)
        if user_id:
            query = query.filter(AuditEvent.user_id == user_id)
            
        events = query.order_by(desc(AuditEvent.timestamp)).limit(limit).all()
        
        results = []
        for ev in events:
            user_name = ev.user.full_name if ev.user else "System"
            results.append(AuditEventResponse(
                id=ev.id,
                user_id=ev.user_id,
                patient_id=ev.patient_id,
                action=ev.action,
                resource=ev.resource,
                timestamp=ev.timestamp,
                ip_address=ev.ip_address,
                metadata_json=ev.metadata_json,
                user_name=user_name
            ))
        return results
