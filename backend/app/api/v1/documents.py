import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse, PlainTextResponse, Response
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, User, Document, Chunk, Patient
from backend.app.auth.guards import get_current_user, require_patient_access
from backend.app.schemas.document import DocumentResponse, DocumentChunkResponse
from backend.app.ingestion.upload import ingest_document
from backend.app.ingestion.pdf_exporter import build_clinical_pdf
from backend.app.security.security_logging import log_security_event

router = APIRouter(prefix="/patients/{patient_id}/documents", tags=["Documents"])

@router.post("")
async def upload_patient_document(
    patient_id: str = Depends(require_patient_access),
    file: UploadFile = File(...),
    cycle_label: str = Form("Cycle 2"),
    document_type: str = Form("Consultation Note"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ingests and parses a clinical document for the authorized patient.
    Reconciles new facts against existing records and creates a change summary.
    """
    result = await ingest_document(
        db=db,
        patient_id=patient_id,
        file=file,
        uploaded_by=current_user.full_name,
        user_id=current_user.id,
        cycle_label=cycle_label,
        document_type=document_type
    )
    
    return {
        "success": True,
        "document_id": result["document"].id,
        "filename": result["document"].filename,
        "version": result["document"].version,
        "status": result["document"].status,
        "chunks_count": result["chunks_count"],
        "pages_count": result["pages_count"],
        "changes": result["changes"]
    }

@router.get("", response_model=List[DocumentResponse])
def list_patient_documents(
    patient_id: str = Depends(require_patient_access),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).filter(Document.patient_id == patient_id).order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        chunk_count = db.query(Chunk).filter(Chunk.document_id == d.id).count()
        results.append(DocumentResponse(
            id=d.id,
            patient_id=d.patient_id,
            filename=d.filename,
            cycle_label=d.cycle_label,
            document_type=d.document_type,
            version=d.version,
            status=d.status,
            hash=d.hash,
            uploaded_by=d.uploaded_by,
            created_at=d.created_at,
            page_count=1,
            chunk_count=chunk_count
        ))
    return results

@router.get("/{document_id}/status")
def get_document_status(
    document_id: str,
    patient_id: str = Depends(require_patient_access),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.patient_id == patient_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    chunks_count = db.query(Chunk).filter(Chunk.document_id == document_id).count()
    return {
        "document_id": doc.id,
        "status": doc.status,
        "version": doc.version,
        "chunks_count": chunks_count,
        "cycle_label": doc.cycle_label
    }

@router.get("/{document_id}/view")
def view_document_content(
    document_id: str,
    patient_id: str = Depends(require_patient_access),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.patient_id == patient_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    chunks = db.query(Chunk).filter(Chunk.document_id == document_id).order_by(Chunk.page_number.asc(), Chunk.chunk_index.asc()).all()
    
    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "document_type": doc.document_type,
        "cycle_label": doc.cycle_label,
        "version": doc.version,
        "created_at": doc.created_at,
        "chunks": [
            {
                "id": c.id,
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
                "content": c.content
            } for c in chunks
        ]
    }


@router.get("/{document_id}/pdf")
def get_document_pdf(
    document_id: str,
    patient_id: str = Depends(require_patient_access),
    download: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Renders or streams an authentic clinical PDF document for viewing or downloading.
    """
    doc = db.query(Document).filter(Document.id == document_id, Document.patient_id == patient_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    filename = doc.filename
    if not filename.lower().endswith(".pdf"):
        filename = f"{filename}.pdf"

    disposition = "attachment" if download else "inline"

    # Check if physical file on disk is already a binary PDF (%PDF-)
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            with open(doc.file_path, "rb") as f:
                header = f.read(5)
            if header.startswith(b"%PDF-"):
                log_security_event(
                    db=db,
                    action="DOCUMENT_PDF_DOWNLOAD",
                    resource=f"/patients/{patient_id}/documents/{document_id}/pdf",
                    user_id=current_user.id if current_user else None,
                    patient_id=patient_id,
                    metadata={"document_id": doc.id, "filename": filename, "source": "disk_binary"}
                )
                return FileResponse(
                    doc.file_path,
                    media_type="application/pdf",
                    filename=filename,
                    headers={"Content-Disposition": f'{disposition}; filename="{filename}"'}
                )
        except Exception:
            pass

    # Extract text content from file or chunks
    raw_content = ""
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            with open(doc.file_path, "r", encoding="utf-8", errors="ignore") as f:
                raw_content = f.read()
        except Exception:
            pass

    if not raw_content:
        chunks = db.query(Chunk).filter(Chunk.document_id == document_id).order_by(Chunk.page_number.asc(), Chunk.chunk_index.asc()).all()
        raw_content = "\n\n".join(c.content for c in chunks)

    # Generate authentic hospital-grade PDF
    pdf_bytes = build_clinical_pdf(doc, patient, raw_content)

    log_security_event(
        db=db,
        action="DOCUMENT_PDF_DOWNLOAD",
        resource=f"/patients/{patient_id}/documents/{document_id}/pdf",
        user_id=current_user.id if current_user else None,
        patient_id=patient_id,
        metadata={"document_id": doc.id, "filename": filename, "download": download}
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Cache-Control": "no-cache",
        }
    )
