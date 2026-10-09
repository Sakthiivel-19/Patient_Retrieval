import io
from typing import List, Dict, Any
import pypdf
from backend.app.core.logging import logger

def extract_pages_from_bytes(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Extracts text preserving page numbers.
    Returns list of dicts: [{"page_number": int, "text": str}]
    """
    pages_data = []
    
    if filename.lower().endswith(".pdf"):
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page_idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                pages_data.append({
                    "page_number": page_idx + 1,
                    "text": page_text.strip()
                })
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            # Fallback treating raw content as plain text if reader fails
            raw_text = file_bytes.decode("utf-8", errors="ignore")
            pages_data.append({"page_number": 1, "text": raw_text})
    else:
        text = file_bytes.decode("utf-8", errors="ignore")
        # Check for page markers like --- Page 2 --- or Form Feed \x0c
        if "\x0c" in text:
            raw_pages = text.split("\x0c")
            for idx, p in enumerate(raw_pages):
                if p.strip():
                    pages_data.append({"page_number": idx + 1, "text": p.strip()})
        else:
            pages_data.append({"page_number": 1, "text": text.strip()})
            
    return pages_data
