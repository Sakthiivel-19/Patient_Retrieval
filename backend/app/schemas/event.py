from pydantic import BaseModel
from typing import Optional

class EventResponse(BaseModel):
    id: int
    patient_id: str
    document_id: Optional[str] = None
    cycle_label: Optional[str] = "Cycle 1"
    event_type: str
    event_date: str
    description: str
    source_page: Optional[int] = 1
    
    class Config:
        from_attributes = True
