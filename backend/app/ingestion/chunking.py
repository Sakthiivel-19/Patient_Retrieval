import uuid
from typing import List, Dict, Any

def create_page_aware_chunks(
    pages: List[Dict[str, Any]],
    patient_id: str,
    document_id: str,
    document_name: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> List[Dict[str, Any]]:
    """
    Creates chunks with accurate provenance:
    - patient_id
    - document_id
    - document_name
    - page_number
    - chunk_id
    - chunk_index
    - content
    """
    chunks = []
    
    for page in pages:
        page_num = page["page_number"]
        text = page["text"]
        
        if not text:
            continue
            
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [text]
            
        current_chunk = ""
        chunk_idx = 0
        
        for para in paragraphs:
            if len(current_chunk) + len(para) > chunk_size and current_chunk:
                chunk_id = f"chk_{document_id}_p{page_num}_{chunk_idx}"
                chunks.append({
                    "id": chunk_id,
                    "patient_id": patient_id,
                    "document_id": document_id,
                    "document_name": document_name,
                    "page_number": page_num,
                    "chunk_index": chunk_idx,
                    "content": current_chunk.strip()
                })
                chunk_idx += 1
                current_chunk = para + "\n\n"
            else:
                current_chunk += para + "\n\n"
                
        if current_chunk.strip():
            chunk_id = f"chk_{document_id}_p{page_num}_{chunk_idx}"
            chunks.append({
                "id": chunk_id,
                "patient_id": patient_id,
                "document_id": document_id,
                "document_name": document_name,
                "page_number": page_num,
                "chunk_index": chunk_idx,
                "content": current_chunk.strip()
            })
            
    return chunks
