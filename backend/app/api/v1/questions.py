from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, User, AuditEvent
from backend.app.auth.guards import get_current_user, require_patient_access
from backend.app.schemas.question import QuestionRequest, QuestionResponse, SourceCitation
from backend.app.security.input_validation import validate_and_sanitize_question
from backend.app.security.output_validation import validate_llm_output
from backend.app.security.security_logging import log_security_event
from backend.app.retrieval.vector_search import PatientVectorSearch
from backend.app.retrieval.structured_search import StructuredFactsSearch
from backend.app.retrieval.context_builder import ContextBuilder
from backend.app.retrieval.citations import CitationValidator
from backend.app.providers.llm import get_llm_provider

router = APIRouter(prefix="/patients/{patient_id}/questions", tags=["RAG Question Answering"])

@router.post("", response_model=QuestionResponse)
async def ask_patient_question(
    req: QuestionRequest,
    patient_id: str = Depends(require_patient_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    RAG Pipeline following strict security:
    1. Validate & sanitize input (reject prompt injections)
    2. Check role + patient authorization
    3. Patient-scoped retrieval ONLY (semantic chunks + structured facts)
    4. Minimal safe context builder
    5. Grounded clinical answer generation
    6. Citation verification
    7. Write immutable audit log
    """
    # 1. Validate & Sanitize
    sanitized_question = validate_and_sanitize_question(req.question)
    
    # 2. Retrieve Authorized Patient-Scoped Semantic Chunks
    relevant_chunks = PatientVectorSearch.search_authorized_chunks(
        db=db,
        patient_id=patient_id,
        query=sanitized_question,
        top_k=4
    )
    
    # 3. Retrieve Structured Facts
    structured_facts = StructuredFactsSearch.get_patient_structured_facts(
        db=db,
        patient_id=patient_id
    )
    
    # 4. Generate Grounded Clinical Answer
    llm = get_llm_provider()
    raw_answer, raw_sources = await llm.generate_grounded_answer(
        question=sanitized_question,
        context_chunks=relevant_chunks,
        structured_facts=structured_facts
    )
    
    # 5. Validate Citations
    citations = CitationValidator.validate_and_format_citations(
        raw_sources=raw_sources,
        available_chunks=relevant_chunks
    )
    
    # 6. Validate Output & Enforce Boundaries
    validated_answer, limitations = validate_llm_output(raw_answer, citations)
    
    # 7. Write Audit Log
    log_security_event(
        db=db,
        action="RAG_QUESTION",
        resource=f"/patients/{patient_id}/questions",
        user_id=current_user.id,
        patient_id=patient_id,
        metadata={
            "question": sanitized_question,
            "sources_count": len(citations),
            "retrieval_chunks_count": len(relevant_chunks)
        }
    )
    
    return QuestionResponse(
        answer=validated_answer,
        sources=citations,
        limitations=limitations,
        patient_id=patient_id,
        retrieval_mode="authorized_patient_scoped_rag",
        security_verified=True
    )
