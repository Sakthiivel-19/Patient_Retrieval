import hashlib
from fastapi import HTTPException, UploadFile, status

MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}

def validate_uploaded_file(file: UploadFile) -> str:
    filename = file.filename or "unknown"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only PDF and TXT documents are supported."
        )
    return ext

def calculate_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()
