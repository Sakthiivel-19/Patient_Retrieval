from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.core.database import get_db, User, AuditEvent
from backend.app.auth.authentication import verify_password, create_access_token
from backend.app.auth.guards import get_current_user
from backend.app.security.security_logging import log_security_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        log_security_event(
            db=db,
            action="AUTH_FAILED",
            resource="/auth/login",
            metadata={"email": req.email}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    
    log_security_event(
        db=db,
        action="AUTH_LOGIN",
        resource="/auth/login",
        user_id=user.id,
        metadata={"role": user.role, "name": user.full_name}
    )
    
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role
    }
