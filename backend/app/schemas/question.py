from pydantic import BaseModel, Field
from typing import List, Optional

class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)

class SourceCitation(BaseModel):
    document: str
    page: int
    excerpt: str
    chunk_id: Optional[str] = None
    relevance_score: Optional[float] = 1.0

class QuestionResponse(BaseModel):
    answer: str
    sources: List[SourceCitation] = []
    limitations: List[str] = []
    patient_id: str
    retrieval_mode: Optional[str] = "hybrid_authorized_rag"
    security_verified: bool = True
