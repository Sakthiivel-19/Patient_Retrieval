from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, User
from backend.app.auth.guards import get_current_user
from backend.app.audit.service import AuditService
from backend.app.audit.schemas import AuditEventResponse

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=List[AuditEventResponse])
def get_audit_logs(
    patient_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns immutable audit trail of accesses, queries, uploads, and permission checks.
    """
    return AuditService.get_events(db, patient_id=patient_id, limit=limit)
