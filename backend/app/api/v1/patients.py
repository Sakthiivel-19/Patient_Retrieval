from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, User
from backend.app.auth.guards import get_current_user, require_patient_access
from backend.app.patients.service import PatientService
from backend.app.schemas.patient import PatientResponse, PatientBrief
from backend.app.security.security_logging import log_security_event

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def list_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns patient directory. For non-admins, unauthorized patients are flagged with has_grant=False.
    """
    patients = PatientService.get_patient_directory(db, current_user)
    log_security_event(
        db=db,
        action="PATIENT_DIRECTORY_VIEW",
        resource="/patients",
        user_id=current_user.id,
        metadata={"count": len(patients)}
    )
    return patients

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str = Depends(require_patient_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    brief = PatientService.get_patient_brief(db, patient_id)
    if not brief:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    log_security_event(
        db=db,
        action="PATIENT_RECORD_VIEW",
        resource=f"/patients/{patient_id}",
        user_id=current_user.id,
        patient_id=patient_id
    )
    return brief.patient

@router.get("/{patient_id}/brief", response_model=PatientBrief)
def get_patient_brief(
    patient_id: str = Depends(require_patient_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    brief = PatientService.get_patient_brief(db, patient_id)
    if not brief:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    log_security_event(
        db=db,
        action="PATIENT_BRIEF_VIEW",
        resource=f"/patients/{patient_id}/brief",
        user_id=current_user.id,
        patient_id=patient_id
    )
    return brief
