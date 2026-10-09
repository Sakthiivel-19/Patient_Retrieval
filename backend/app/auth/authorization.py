from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.core.database import User, PatientGrant, Patient
from backend.app.auth.roles import Role

def check_patient_authorization(
    db: Session,
    user_id: int,
    user_role: str,
    patient_id: str,
    required_permission: Optional[str] = "read"
) -> bool:
    """
    Core Security Principle: Authorize before retrieval.
    Admin has full access.
    Clinical staff and reviewers need an explicit grant in patient_grants table.
    """
    if user_role == Role.ADMIN:
        # Check if patient exists
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        return patient is not None
        
    grant = db.query(PatientGrant).filter(
        PatientGrant.user_id == user_id,
        PatientGrant.patient_id == patient_id
    ).first()
    
    if not grant:
        return False
        
    if required_permission:
        permissions = [p.strip().lower() for p in grant.permissions.split(",")]
        return required_permission.lower() in permissions or "all" in permissions
        
    return True

def get_authorized_patient_ids(db: Session, user: User) -> List[str]:
    """Returns list of patient IDs this user is authorized to access"""
    if user.role == Role.ADMIN:
        return [p.id for p in db.query(Patient.id).all()]
        
    grants = db.query(PatientGrant.patient_id).filter(PatientGrant.user_id == user.id).all()
    return [g[0] for g in grants]
