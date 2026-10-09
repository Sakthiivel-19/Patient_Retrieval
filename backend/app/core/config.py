import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CareLens AI"
    APP_ENV: str = "development"
    PORT: int = 8000
    DATABASE_URL: str = "sqlite:///./carelens.db"
    JWT_SECRET: str = "carelens_super_secret_jwt_key_hackathon_2026_clinical_intelligence"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    
    # LLM Settings
    LLM_PROVIDER: str = "builtin" # "builtin" (deterministic clinical reasoning), "gemini", or "openai"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-3.8-flash"
    EMBEDDING_MODEL: str = "builtin-clinical-embedding"
    
    # Storage
    STORAGE_DIR: str = "./storage/documents"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
