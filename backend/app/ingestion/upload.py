import os
import uuid
import json
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile

from backend.app.core.config import settings
from backend.app.core.database import Document, Chunk, Event, TestRequest, TestResult, Conflict, AuditEvent
from backend.app.ingestion.validation import validate_uploaded_file, calculate_file_hash
from backend.app.ingestion.extraction import extract_pages_from_bytes
from backend.app.ingestion.chunking import create_page_aware_chunks
from backend.app.ingestion.facts import extract_candidate_facts_from_text
from backend.app.ingestion.versioning import process_document_versioning
from backend.app.providers.embeddings import get_embeddings_service

async def ingest_document(
    db: Session,
    patient_id: str,
    file: UploadFile,
    uploaded_by: str = "doctor_a",
    user_id: int = 1,
    cycle_label: str = "Cycle 2",
    document_type: str = "Clinical Report"
) -> Dict[str, Any]:
    # 1. Validate file
    validate_uploaded_file(file)
    file_bytes = await file.read()
    file_hash = calculate_file_hash(file_bytes)
    
    # Check deduplication
    existing_doc = db.query(Document).filter(
        Document.patient_id == patient_id,
        Document.hash == file_hash
    ).first()
    
    doc_id = f"DOC-{patient_id}-{str(uuid.uuid4())[:8].upper()}"
    filename = file.filename or f"report_{doc_id}.pdf"
    
    # Save file to private storage
    os.makedirs(f"{settings.STORAGE_DIR}/{patient_id}", exist_ok=True)
    file_path = f"{settings.STORAGE_DIR}/{patient_id}/{doc_id}_{filename}"
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    # Create Document record
    version = 1
    if existing_doc:
        version = existing_doc.version + 1
        
    new_doc = Document(
        id=doc_id,
        patient_id=patient_id,
        filename=filename,
        file_path=file_path,
        hash=file_hash,
        version=version,
        status="processed",
        uploaded_by=uploaded_by,
        cycle_label=cycle_label,
        document_type=document_type,
        created_at=datetime.utcnow()
    )
    db.add(new_doc)
    db.flush()
    
    # 2. Extract pages
    pages = extract_pages_from_bytes(file_bytes, filename)
    
    # 3. Page-aware chunking
    chunks_data = create_page_aware_chunks(pages, patient_id, doc_id, filename)
    
    # 4. Generate embeddings and save chunks
    embeddings_service = get_embeddings_service()
    total_text = ""
    for ch in chunks_data:
        emb = embeddings_service.embed_text(ch["content"])
        chunk_rec = Chunk(
            id=ch["id"],
            document_id=doc_id,
            patient_id=patient_id,
            page_number=ch["page_number"],
            chunk_index=ch["chunk_index"],
            content=ch["content"],
            embedding_json=json.dumps(emb),
            metadata_json=json.dumps({"document_name": filename, "cycle": cycle_label})
        )
        db.add(chunk_rec)
        total_text += "\n" + ch["content"]
        
    # 5. Extract structured candidate facts
    facts = extract_candidate_facts_from_text(total_text, doc_id, patient_id, cycle_label)
    
    # 6. Change Detection and Reconciliation
    changes = process_document_versioning(db, patient_id, doc_id, filename, facts, cycle_label)
    
    # Persist extracted events
    for ev in facts["events"]:
        event_rec = Event(
            patient_id=patient_id,
            document_id=doc_id,
            cycle_label=cycle_label,
            event_type=ev["event_type"],
            event_date=ev["event_date"],
            description=ev["description"],
            source_page=ev["source_page"]
        )
        db.add(event_rec)
        
    # Persist extracted test requests
    for req in facts["test_requests"]:
        req_rec = TestRequest(
            id=f"REQ-{patient_id}-{uuid.uuid4().hex[:6]}",
            patient_id=patient_id,
            document_id=doc_id,
            cycle_label=cycle_label,
            test_name=req["test_name"],
            requested_date=req["requested_date"],
            status="pending",
            requesting_physician=req.get("requesting_physician", "Dr. Sarah Miller")
        )
        db.add(req_rec)
        
    # Persist extracted test results
    for res in facts["test_results"]:
        res_rec = TestResult(
            id=f"RES-{patient_id}-{uuid.uuid4().hex[:6]}",
            patient_id=patient_id,
            document_id=doc_id,
            cycle_label=cycle_label,
            test_name=res["test_name"],
            result_date=res["result_date"],
            result_data=res["result_data"],
            reference_range=res["reference_range"],
            is_abnormal=res["is_abnormal"]
        )
        db.add(res_rec)
        
    # Persist conflicts
    for conf in changes["conflicts_detected"]:
        conflict_rec = Conflict(
            id=conf["id"],
            patient_id=patient_id,
            cycle_label=cycle_label,
            conflict_type=conf["conflict_type"],
            fact_a=conf["fact_a"],
            fact_b=conf["fact_b"],
            source_a_doc=conf["source_a_doc"],
            source_a_page=conf["source_a_page"],
            source_b_doc=conf["source_b_doc"],
            source_b_page=conf["source_b_page"],
            status="Needs Review",
            created_at=datetime.utcnow()
        )
        db.add(conflict_rec)
        
    # 7. Write Audit Event
    audit = AuditEvent(
        user_id=user_id,
        patient_id=patient_id,
        action="DOC_UPLOAD",
        resource=f"/documents/{doc_id}",
        metadata_json=json.dumps({
            "filename": filename,
            "chunks_count": len(chunks_data),
            "pages_count": len(pages),
            "changes_summary": changes["summary_text"]
        })
    )
    db.add(audit)
    db.commit()
    db.refresh(new_doc)
    
    return {
        "document": new_doc,
        "chunks_count": len(chunks_data),
        "pages_count": len(pages),
        "extracted_facts": facts,
        "changes": changes
    }
