from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import json

from backend.app.core.database import get_db, User, AuditEvent
from backend.app.auth.authentication import decode_access_token
from backend.app.auth.authorization import check_patient_authorization

security_bearer = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
        )
        
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
        
    return user

def require_patient_access(
    patient_id: str,
    permission: str = "read",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> str:
    """
    Security Guard: Ensures user has explicit authorization for patient_id before ANY retrieval.
    Logs ACCESS_DENIED audit events on failure.
    """
    is_authorized = check_patient_authorization(
        db=db,
        user_id=current_user.id,
        user_role=current_user.role,
        patient_id=patient_id,
        required_permission=permission
    )
    
    if not is_authorized:
        # Record security audit event
        audit = AuditEvent(
            user_id=current_user.id,
            patient_id=patient_id,
            action="ACCESS_DENIED",
            resource=f"/patients/{patient_id}",
            metadata_json=json.dumps({
                "reason": "Missing patient grant or role permission",
                "attempted_permission": permission,
                "user_role": current_user.role
            })
        )
        db.add(audit)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: You are not authorized to access patient records for '{patient_id}'."
        )
        
    return patient_id

def require_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Security Guard: Ensures the user has the 'admin' role before accessing hospital administration resources.
    """
    if not current_user or current_user.role.lower() != "admin":
        audit = AuditEvent(
            user_id=current_user.id if current_user else None,
            action="ADMIN_ACCESS_DENIED",
            resource="/admin",
            metadata_json=json.dumps({
                "reason": "Administrative role required",
                "user_role": current_user.role if current_user else "anonymous",
                "user_email": current_user.email if current_user else "anonymous"
            })
        )
        db.add(audit)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Admin privileges required to access administrative resources."
        )
        
    return current_user

