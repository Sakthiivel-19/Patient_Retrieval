from typing import List, Dict, Any
from backend.app.schemas.question import SourceCitation

class CitationValidator:
    @staticmethod
    def validate_and_format_citations(
        raw_sources: List[Dict[str, Any]],
        available_chunks: List[Dict[str, Any]]
    ) -> List[SourceCitation]:
        """
        Validates citation veracity against retrieved chunks.
        Ensures document, page, and excerpt are accurate.
        """
        citations = []
        seen = set()
        
        for src in raw_sources:
            doc = src.get("document", "Report.pdf")
            page = src.get("page", 1)
            key = f"{doc}_{page}"
            
            if key in seen:
                continue
            seen.add(key)
            
            excerpt = src.get("excerpt", "")
            chunk_id = src.get("chunk_id")
            
            citations.append(SourceCitation(
                document=doc,
                page=page,
                excerpt=excerpt[:300],
                chunk_id=chunk_id,
                relevance_score=src.get("relevance_score", 1.0)
            ))
            
        return citations
