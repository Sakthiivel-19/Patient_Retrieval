import html
import re
from fastapi import HTTPException, status
from backend.app.security.prompt_guard import scan_for_prompt_injection

def validate_and_sanitize_question(question: str) -> str:
    if not question or len(question.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty or fewer than 2 characters."
        )
    if len(question) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question exceeds maximum allowed length (1000 characters)."
        )
    
    is_malicious, reason = scan_for_prompt_injection(question)
    if is_malicious:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security Alert: Question rejected due to security policy violation ({reason})."
        )
        
    # Sanitize html characters
    sanitized = html.escape(question.strip())
    return sanitized

def validate_patient_id(patient_id: str) -> str:
    if not re.match(r"^[A-Za-z0-9\-_]{2,50}$", patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient identifier format."
        )
    return patient_id
