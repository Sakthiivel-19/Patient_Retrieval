from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class PatientBase(BaseModel):
    id: str
    name: str
    date_of_birth: str
    gender: Optional[str] = "Unknown"
    mrn: str
    metadata_json: Optional[str] = "{}"

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    created_at: Optional[datetime] = None
    has_grant: Optional[bool] = True
    permissions: Optional[List[str]] = []
    
    class Config:
        from_attributes = True

class PatientBrief(BaseModel):
    patient: PatientResponse
    total_documents: int
    total_events: int
    pending_tests_count: int
    unresolved_conflicts_count: int
    active_cycles: List[str]
    recent_events: List[Dict[str, Any]]
