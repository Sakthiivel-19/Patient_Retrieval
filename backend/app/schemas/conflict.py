from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConflictResponse(BaseModel):
    id: str
    patient_id: str
    cycle_label: str
    conflict_type: str
    fact_a: str
    fact_b: str
    source_a_doc: str
    source_a_page: int
    source_b_doc: str
    source_b_page: int
    status: str # "Needs Review", "Resolved_A", "Resolved_B", "Dismissed"
    reviewed_by: Optional[str] = None
    resolution_note: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConflictReviewRequest(BaseModel):
    status: str # "Resolved_A", "Resolved_B", "Dismissed", "Needs Review"
    resolution_note: str
    accepted_fact: Optional[str] = None
