from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditEventResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    patient_id: Optional[str] = None
    action: str
    resource: str
    timestamp: datetime
    ip_address: str
    metadata_json: Optional[str] = "{}"
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True
