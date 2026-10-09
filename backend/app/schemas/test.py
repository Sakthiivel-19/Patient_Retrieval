from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class TestRequestResponse(BaseModel):
    id: str
    patient_id: str
    document_id: Optional[str] = None
    cycle_label: str
    test_name: str
    requested_date: str
    status: str # recorded_pending, matched, result_not_found, needs_review
    requesting_physician: str
    
    class Config:
        from_attributes = True

class TestResultResponse(BaseModel):
    id: str
    patient_id: str
    document_id: Optional[str] = None
    cycle_label: str
    test_name: str
    result_date: str
    result_data: str
    reference_range: Optional[str] = None
    is_abnormal: bool = False
    
    class Config:
        from_attributes = True

class ReconciliationItem(BaseModel):
    request_id: str
    test_name: str
    requested_date: str
    status: str # "Matched", "Recorded Pending", "Result not found", "Needs review"
    request_document: Optional[str] = None
    request_doc_id: Optional[str] = None
    result_id: Optional[str] = None
    result_date: Optional[str] = None
    result_data: Optional[str] = None
    result_document: Optional[str] = None
    result_doc_id: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: Optional[bool] = False
    evidence: Optional[str] = None
    cycle_label: str

class ReconciliationSummary(BaseModel):
    patient_id: str
    total_requested: int
    matched_count: int
    pending_count: int
    missing_count: int
    needs_review_count: int
    items: List[ReconciliationItem]
