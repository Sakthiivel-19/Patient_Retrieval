from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, User
from backend.app.auth.guards import get_current_user, require_patient_access
from backend.app.reconciliation.reconciliation_service import ReconciliationService
from backend.app.schemas.test import ReconciliationSummary
from backend.app.security.security_logging import log_security_event

router = APIRouter(prefix="/patients/{patient_id}/reconciliation", tags=["Reconciliation"])

@router.get("", response_model=ReconciliationSummary)
def get_reconciliation(
    patient_id: str = Depends(require_patient_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the test request to lab result matching matrix:
    - Matched
    - Recorded Pending
    - Result not found
    - Needs review
    """
    summary = ReconciliationService.get_test_reconciliation(db, patient_id)
    log_security_event(
        db=db,
        action="RECONCILIATION_VIEW",
        resource=f"/patients/{patient_id}/reconciliation",
        user_id=current_user.id,
        patient_id=patient_id
    )
    return summary
