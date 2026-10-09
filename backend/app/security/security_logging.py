import json
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.database import AuditEvent
from backend.app.core.logging import logger

def log_security_event(
    db: Session,
    action: str,
    resource: str,
    user_id: Optional[int] = None,
    patient_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    ip_address: str = "127.0.0.1"
) -> AuditEvent:
    event = AuditEvent(
        user_id=user_id,
        patient_id=patient_id,
        action=action,
        resource=resource,
        timestamp=datetime.utcnow(),
        ip_address=ip_address,
        metadata_json=json.dumps(metadata or {})
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    logger.info(f"[SECURITY AUDIT] action={action} user_id={user_id} patient_id={patient_id} resource={resource}")
    return event
