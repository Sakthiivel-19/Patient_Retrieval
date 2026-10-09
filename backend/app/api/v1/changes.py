from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, User
from backend.app.auth.guards import get_current_user, require_patient_access
from backend.app.reconciliation.reconciliation_service import ReconciliationService
from backend.app.security.security_logging import log_security_event

router = APIRouter(prefix="/patients/{patient_id}/changes", tags=["Change Detection"])

@router.get("")
def get_changes(
    patient_id: str = Depends(require_patient_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns historical change summary and provenance logs.
    """
    changes = ReconciliationService.get_changes(db, patient_id)
    log_security_event(
        db=db,
        action="CHANGES_VIEW",
        resource=f"/patients/{patient_id}/changes",
        user_id=current_user.id,
        patient_id=patient_id
    )
    return changes
