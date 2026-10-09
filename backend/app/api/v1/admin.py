from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, User, StaffProfile, Patient, PatientGrant, AuditEvent
from backend.app.auth.guards import get_current_user, require_admin
from backend.app.auth.authentication import hash_password
from backend.app.security.security_logging import log_security_event

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

# ----------------- Schemas -----------------
class CreateDoctorRequest(BaseModel):
    full_name: str
    email: str
    password: str
    department: str = "Internal Medicine"
    license_number: str = "MD-CL-2026"
    role: str = "doctor" # "doctor", "reviewer", "auditor", "admin"

class CreateGrantRequest(BaseModel):
    user_id: int
    patient_id: str
    permissions: str = "read,write,query,reconcile"

class CreatePatientRequest(BaseModel):
    id: Optional[str] = None
    name: str
    mrn: str
    date_of_birth: str
    gender: str = "Female"
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    assigned_doctor_ids: List[int] = []
    permissions: str = "read,write,query,reconcile"

class UserSummaryResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    department: Optional[str] = "General"
    license_number: Optional[str] = "MD-CL"
    created_at: Optional[datetime] = None
    grants: List[Dict[str, Any]] = []

class GrantResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    patient_id: str
    patient_name: str
    patient_mrn: str
    permissions: str
    granted_by: str
    created_at: Optional[datetime] = None

class DoctorActivityItem(BaseModel):
    id: int
    timestamp: datetime
    user_id: Optional[int] = None
    doctor_name: str
    doctor_role: str
    doctor_email: str
    action: str
    resource: str
    status: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    details: Dict[str, Any] = {}

# ----------------- Endpoints -----------------

@router.get("/users", response_model=List[UserSummaryResponse])
def list_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns all registered doctors, reviewers, auditors, and administrators with their profile details and patient grants.
    """
    users = db.query(User).all()
    results = []
    
    for u in users:
        dept = u.profile.department if u.profile else "General"
        lic = u.profile.license_number if u.profile else "N/A"
        
        user_grants = []
        for g in u.grants:
            p_name = g.patient.name if g.patient else g.patient_id
            user_grants.append({
                "grant_id": g.id,
                "patient_id": g.patient_id,
                "patient_name": p_name,
                "permissions": g.permissions,
                "created_at": g.created_at
            })
            
        results.append(UserSummaryResponse(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
            department=dept,
            license_number=lic,
            created_at=u.created_at,
            grants=user_grants
        ))
        
    return results


@router.post("/users", response_model=UserSummaryResponse)
def create_doctor_or_user(
    req: CreateDoctorRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Registers a new doctor or clinician in the database with role, department, and license number.
    """
    clean_email = req.email.strip().lower()
    
    # Check if email exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{clean_email}' already exists in database."
        )
        
    # Create User
    new_user = User(
        email=clean_email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name.strip(),
        role=req.role.strip().lower(),
        is_active=True
    )
    db.add(new_user)
    db.flush()
    
    # Create Staff Profile
    profile = StaffProfile(
        user_id=new_user.id,
        role=req.role,
        department=req.department.strip(),
        license_number=req.license_number.strip()
    )
    db.add(profile)
    
    # Log Audit Event
    log_security_event(
        db=db,
        action="USER_CREATED",
        resource=f"/admin/users/{new_user.id}",
        user_id=current_user.id if current_user else None,
        metadata={
            "created_user_id": new_user.id,
            "created_email": new_user.email,
            "role": new_user.role,
            "created_by": current_user.email if current_user else "admin"
        }
    )
    
    db.commit()
    db.refresh(new_user)
    
    return UserSummaryResponse(
        id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=new_user.role,
        is_active=new_user.is_active,
        department=profile.department,
        license_number=profile.license_number,
        created_at=new_user.created_at,
        grants=[]
    )


@router.get("/grants", response_model=List[GrantResponse])
def list_all_grants(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Lists all active patient access grants across doctors and clinical staff.
    """
    grants = db.query(PatientGrant).all()
    results = []
    
    for g in grants:
        results.append(GrantResponse(
            id=g.id,
            user_id=g.user_id,
            user_name=g.user.full_name if g.user else f"User {g.user_id}",
            user_email=g.user.email if g.user else "",
            patient_id=g.patient_id,
            patient_name=g.patient.name if g.patient else g.patient_id,
            patient_mrn=g.patient.mrn if g.patient else "",
            permissions=g.permissions,
            granted_by=g.granted_by,
            created_at=g.created_at
        ))
        
    return results


@router.post("/grants", response_model=GrantResponse)
def create_patient_grant(
    req: CreateGrantRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Grants a doctor or clinician explicit access to a patient record.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Doctor / User not found.")
        
    patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found.")
        
    # Check if grant already exists
    existing = db.query(PatientGrant).filter(
        PatientGrant.user_id == req.user_id,
        PatientGrant.patient_id == req.patient_id
    ).first()
    
    if existing:
        existing.permissions = req.permissions
        existing.granted_by = current_user.email if current_user else "admin"
        db.commit()
        db.refresh(existing)
        target_grant = existing
    else:
        new_grant = PatientGrant(
            user_id=req.user_id,
            patient_id=req.patient_id,
            permissions=req.permissions,
            granted_by=current_user.email if current_user else "admin"
        )
        db.add(new_grant)
        db.commit()
        db.refresh(new_grant)
        target_grant = new_grant
        
    # Log Audit Event
    log_security_event(
        db=db,
        action="GRANT_ASSIGNED",
        resource=f"/patients/{req.patient_id}",
        user_id=current_user.id if current_user else None,
        patient_id=req.patient_id,
        metadata={
            "granted_to_user_id": user.id,
            "granted_to_email": user.email,
            "patient_id": req.patient_id,
            "permissions": req.permissions,
            "granted_by": current_user.email if current_user else "admin"
        }
    )
    
    return GrantResponse(
        id=target_grant.id,
        user_id=user.id,
        user_name=user.full_name,
        user_email=user.email,
        patient_id=patient.id,
        patient_name=patient.name,
        patient_mrn=patient.mrn,
        permissions=target_grant.permissions,
        granted_by=target_grant.granted_by,
        created_at=target_grant.created_at
    )


@router.post("/patients")
def create_patient_and_grants(
    req: CreatePatientRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Hospital Intake Desk: Registers a new patient into carelens.db, assigns attending doctor grants, and logs immutable security audit event.
    """
    import json
    patient_id = req.id.strip().upper() if req.id and req.id.strip() else None
    if not patient_id:
        existing_ids = [p[0] for p in db.query(Patient.id).all()]
        idx = len(existing_ids) + 1
        candidate = f"P{idx:03d}"
        while candidate in existing_ids:
            idx += 1
            candidate = f"P{idx:03d}"
        patient_id = candidate
        
    if db.query(Patient).filter(Patient.id == patient_id).first():
        raise HTTPException(status_code=400, detail=f"Patient ID '{patient_id}' already exists.")
    if db.query(Patient).filter(Patient.mrn == req.mrn.strip()).first():
        raise HTTPException(status_code=400, detail=f"Patient MRN '{req.mrn.strip()}' already exists.")
        
    metadata_dict = {
        "conditions": [c.strip() for c in req.conditions.split(",")] if req.conditions else [],
        "allergies": [a.strip() for a in req.allergies.split(",")] if req.allergies else []
    }
    
    new_patient = Patient(
        id=patient_id,
        name=req.name.strip(),
        date_of_birth=req.date_of_birth.strip(),
        gender=req.gender.strip(),
        mrn=req.mrn.strip(),
        metadata_json=json.dumps(metadata_dict)
    )
    db.add(new_patient)
    db.flush()
    
    created_grants = []
    for doc_id in req.assigned_doctor_ids:
        doc = db.query(User).filter(User.id == doc_id).first()
        if doc:
            g = PatientGrant(
                user_id=doc.id,
                patient_id=patient_id,
                permissions=req.permissions,
                granted_by=current_user.email if current_user else "admin"
            )
            db.add(g)
            created_grants.append({"doctor_id": doc.id, "doctor_name": doc.full_name, "email": doc.email})
            
    log_security_event(
        db=db,
        action="PATIENT_REGISTERED",
        resource=f"/patients/{patient_id}",
        user_id=current_user.id if current_user else None,
        patient_id=patient_id,
        metadata={
            "patient_id": patient_id,
            "patient_name": new_patient.name,
            "mrn": new_patient.mrn,
            "registered_by": current_user.email if current_user else "admin",
            "assigned_doctors_count": len(created_grants),
            "assigned_doctors": [cg["doctor_name"] for cg in created_grants]
        }
    )
    
    db.commit()
    db.refresh(new_patient)
    
    return {
        "status": "success",
        "message": f"Patient {new_patient.name} ({patient_id}) registered successfully.",
        "patient": {
            "id": new_patient.id,
            "name": new_patient.name,
            "mrn": new_patient.mrn,
            "date_of_birth": new_patient.date_of_birth,
            "gender": new_patient.gender,
            "metadata": metadata_dict,
            "created_at": new_patient.created_at
        },
        "assigned_grants": created_grants
    }


@router.delete("/grants/{grant_id}")
def revoke_grant(
    grant_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Revokes a doctor's access grant to a patient.
    """
    grant = db.query(PatientGrant).filter(PatientGrant.id == grant_id).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Grant record not found.")
        
    revoked_user_email = grant.user.email if grant.user else str(grant.user_id)
    patient_id = grant.patient_id
    
    db.delete(grant)
    
    # Log Audit Event
    log_security_event(
        db=db,
        action="GRANT_REVOKED",
        resource=f"/patients/{patient_id}",
        user_id=current_user.id if current_user else None,
        patient_id=patient_id,
        metadata={
            "revoked_grant_id": grant_id,
            "revoked_from_email": revoked_user_email,
            "patient_id": patient_id,
            "revoked_by": current_user.email if current_user else "admin"
        }
    )
    
    db.commit()
    return {"status": "success", "message": f"Access grant {grant_id} successfully revoked."}


@router.get("/activity", response_model=List[DoctorActivityItem])
def get_doctor_activities(
    limit: int = Query(100, le=500),
    current_user: User = Depends(require_admin),
    patient_id: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns an activity feed of what doctors are doing: logins, clinical Q&A inquiries, document reviews, conflict resolutions, and access attempts.
    """
    query = db.query(AuditEvent)
    
    if user_id:
        query = query.filter(AuditEvent.user_id == user_id)
    if patient_id:
        query = query.filter(AuditEvent.patient_id == patient_id)
        
    events = query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    
    results = []
    for ev in events:
        d_name = ev.user.full_name if ev.user else "System / Anonymous"
        d_role = ev.user.role if ev.user else "system"
        d_email = ev.user.email if ev.user else "system@carelens.ai"
        p_name = ev.patient.name if ev.patient else (ev.patient_id or "General")
        
        details_parsed = {}
        if ev.metadata_json:
            try:
                import json
                details_parsed = json.loads(ev.metadata_json)
            except:
                pass
                
        status_str = "DENIED" if ("DENIED" in ev.action or "FAIL" in ev.action) else "SUCCESS"
                
        results.append(DoctorActivityItem(
            id=ev.id,
            timestamp=ev.timestamp,
            user_id=ev.user_id,
            doctor_name=d_name,
            doctor_role=d_role,
            doctor_email=d_email,
            action=ev.action,
            resource=ev.resource or "",
            status=status_str,
            patient_id=ev.patient_id,
            patient_name=p_name,
            details=details_parsed
        ))
        
    return results


@router.delete("/patients/{patient_id}")
def delete_patient_record(
    patient_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Administrator action: Permanently deletes a patient chart and cascades removal of grants, documents, and records.
    Logs immutable security audit event.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
        
    pat_name = patient.name
    pat_mrn = patient.mrn
    
    # Log security audit before deletion
    log_security_event(
        db=db,
        action="PATIENT_DELETED",
        resource=f"/patients/{patient_id}",
        user_id=current_user.id if current_user else None,
        patient_id=patient_id,
        metadata={
            "patient_id": patient_id,
            "patient_name": pat_name,
            "mrn": pat_mrn,
            "deleted_by": current_user.email if current_user else "admin"
        }
    )
    
    # Cascade delete grants and patient
    db.query(PatientGrant).filter(PatientGrant.patient_id == patient_id).delete()
    db.delete(patient)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Patient {pat_name} ({patient_id}) permanently removed from database by administrator.",
        "patient_id": patient_id
    }

