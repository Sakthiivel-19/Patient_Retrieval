from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, User
from backend.app.auth.guards import get_current_user, require_patient_access
from backend.app.reconciliation.conflict_detection import ConflictDetectionService
from backend.app.schemas.conflict import ConflictResponse, ConflictReviewRequest

router = APIRouter(prefix="/patients/{patient_id}/conflicts", tags=["Conflicts"])

@router.get("", response_model=List[ConflictResponse])
def get_conflicts(
    patient_id: str = Depends(require_patient_access),
    db: Session = Depends(get_db)
):
    return ConflictDetectionService.list_conflicts(db, patient_id)

@router.post("/{conflict_id}/reviews", response_model=ConflictResponse)
def review_conflict(
    conflict_id: str,
    req: ConflictReviewRequest,
    patient_id: str = Depends(require_patient_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Human-in-the-loop review endpoint.
    Clinician decides resolution (Resolved_A, Resolved_B, Dismissed) with rationale note.
    """
    res = ConflictDetectionService.review_conflict(
        db=db,
        patient_id=patient_id,
        conflict_id=conflict_id,
        req=req,
        reviewer_name=current_user.full_name
    )
    if not res:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return res
