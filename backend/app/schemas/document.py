from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DocumentBase(BaseModel):
    id: str
    patient_id: str
    filename: str
    cycle_label: Optional[str] = "Cycle 1"
    document_type: Optional[str] = "Consultation Note"
    version: Optional[int] = 1
    status: Optional[str] = "processed"

class DocumentResponse(DocumentBase):
    hash: str
    uploaded_by: str
    created_at: datetime
    page_count: Optional[int] = 1
    chunk_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class DocumentChunkResponse(BaseModel):
    id: str
    document_id: str
    page_number: int
    chunk_index: int
    content: str
    metadata_json: Optional[str] = "{}"
    
    class Config:
        from_attributes = True
