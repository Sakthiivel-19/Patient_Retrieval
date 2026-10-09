import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.database import Chunk, Document
from backend.app.providers.embeddings import get_embeddings_service

class PatientVectorSearch:
    @staticmethod
    def search_authorized_chunks(
        db: Session,
        patient_id: str,
        query: str,
        top_k: int = 4,
        threshold: float = 0.05
    ) -> List[Dict[str, Any]]:
        """
        STRICT PATIENT-SCOPED RETRIEVAL:
        Retrieves and ranks chunks ONLY for the authorized patient_id.
        Cross-patient leakage is architecturally prohibited at the SQL filter level.
        """
        # Fetch only chunks belonging to this patient
        chunks = db.query(Chunk, Document.filename)\
            .join(Document, Chunk.document_id == Document.id)\
            .filter(Chunk.patient_id == patient_id)\
            .all()
            
        if not chunks:
            return []
            
        embeddings_service = get_embeddings_service()
        query_vec = embeddings_service.embed_text(query)
        
        scored_chunks = []
        for chunk_obj, filename in chunks:
            if not chunk_obj.embedding_json:
                continue
                
            chunk_vec = json.loads(chunk_obj.embedding_json)
            similarity = embeddings_service.cosine_similarity(query_vec, chunk_vec)
            
            # Keyword matching bonus for exact clinical terms
            q_lower = query.lower()
            c_lower = chunk_obj.content.lower()
            keyword_score = 0.0
            for term in ["test", "blood", "ultrasound", "procedure", "result", "ordered", "cycle", "biopsy"]:
                if term in q_lower and term in c_lower:
                    keyword_score += 0.15
                    
            final_score = similarity + keyword_score
            
            if final_score >= threshold:
                scored_chunks.append({
                    "id": chunk_obj.id,
                    "patient_id": chunk_obj.patient_id,
                    "document_id": chunk_obj.document_id,
                    "document_name": filename,
                    "page_number": chunk_obj.page_number,
                    "chunk_index": chunk_obj.chunk_index,
                    "content": chunk_obj.content,
                    "score": round(final_score, 4)
                })
                
        # Sort descending by score
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]
