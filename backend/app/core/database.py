import json
from datetime import datetime
from typing import Generator
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from backend.app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="doctor") # admin, doctor, reviewer, auditor
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("StaffProfile", back_populates="user", uselist=False)
    grants = relationship("PatientGrant", back_populates="user", foreign_keys="PatientGrant.user_id")
    audit_events = relationship("AuditEvent", back_populates="user")

class StaffProfile(Base):
    __tablename__ = "staff_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    role = Column(String(50), nullable=False)
    department = Column(String(100), default="Internal Medicine")
    license_number = Column(String(100), default="MD-CL-2026")
    
    user = relationship("User", back_populates="profile")

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String(50), primary_key=True, index=True) # e.g. "P001", "P002", "P999"
    name = Column(String(255), nullable=False)
    date_of_birth = Column(String(50), nullable=False)
    gender = Column(String(20), default="Unknown")
    mrn = Column(String(50), unique=True, nullable=False)
    metadata_json = Column(Text, default="{}") # allergies, conditions, blood type
    created_at = Column(DateTime, default=datetime.utcnow)
    
    grants = relationship("PatientGrant", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")
    chunks = relationship("Chunk", back_populates="patient", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="patient", cascade="all, delete-orphan")
    test_requests = relationship("TestRequest", back_populates="patient", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="patient", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="patient", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="patient", cascade="all, delete-orphan")

class PatientGrant(Base):
    __tablename__ = "patient_grants"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    permissions = Column(String(255), default="read,write,query,reconcile") # comma-separated
    granted_by = Column(String(100), default="system_admin")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="grants", foreign_keys=[user_id])
    patient = relationship("Patient", back_populates="grants")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(100), primary_key=True, index=True) # e.g. "DOC-P001-01"
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    hash = Column(String(64), nullable=False)
    version = Column(Integer, default=1)
    status = Column(String(50), default="processed") # uploaded, processing, processed, error
    uploaded_by = Column(String(100), default="system")
    cycle_label = Column(String(50), default="Cycle 1") # "Cycle 1", "Cycle 2", "Update"
    document_type = Column(String(50), default="Consultation Note") # Consultation, Lab Report, Radiology, Discharge
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")

class Chunk(Base):
    __tablename__ = "chunks"
    
    id = Column(String(100), primary_key=True, index=True)
    document_id = Column(String(100), ForeignKey("documents.id"), nullable=False)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    page_number = Column(Integer, nullable=False, default=1)
    chunk_index = Column(Integer, nullable=False, default=0)
    content = Column(Text, nullable=False)
    embedding_json = Column(Text, nullable=True)
    metadata_json = Column(Text, default="{}")
    
    document = relationship("Document", back_populates="chunks")
    patient = relationship("Patient", back_populates="chunks")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    document_id = Column(String(100), ForeignKey("documents.id"), nullable=True)
    cycle_label = Column(String(50), default="Cycle 1")
    event_type = Column(String(100), nullable=False) # Consultation, Test Requested, Lab Result, Procedure, Follow-up
    event_date = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    source_page = Column(Integer, default=1)
    
    patient = relationship("Patient", back_populates="events")

class FactSource(Base):
    __tablename__ = "fact_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    fact_id = Column(String(100), nullable=False)
    document_id = Column(String(100), nullable=False)
    page_number = Column(Integer, nullable=False)
    chunk_id = Column(String(100), nullable=True)
    excerpt = Column(Text, nullable=False)

class TestRequest(Base):
    __tablename__ = "test_requests"
    
    id = Column(String(100), primary_key=True, index=True) # "REQ-001"
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    document_id = Column(String(100), ForeignKey("documents.id"), nullable=True)
    cycle_label = Column(String(50), default="Cycle 1")
    test_name = Column(String(200), nullable=False)
    requested_date = Column(String(50), nullable=False)
    status = Column(String(50), default="pending") # recorded_pending, matched, result_not_found, needs_review
    requesting_physician = Column(String(100), default="Dr. Sarah Miller")
    
    patient = relationship("Patient", back_populates="test_requests")
    links = relationship("RequestResultLink", back_populates="test_request", cascade="all, delete-orphan")

class TestResult(Base):
    __tablename__ = "test_results"
    
    id = Column(String(100), primary_key=True, index=True) # "RES-001"
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    document_id = Column(String(100), ForeignKey("documents.id"), nullable=True)
    cycle_label = Column(String(50), default="Cycle 1")
    test_name = Column(String(200), nullable=False)
    result_date = Column(String(50), nullable=False)
    result_data = Column(Text, nullable=False) # JSON or formatted string
    reference_range = Column(String(100), nullable=True)
    is_abnormal = Column(Boolean, default=False)
    
    patient = relationship("Patient", back_populates="test_results")
    links = relationship("RequestResultLink", back_populates="test_result", cascade="all, delete-orphan")

class RequestResultLink(Base):
    __tablename__ = "request_result_links"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(100), ForeignKey("test_requests.id"), nullable=False)
    result_id = Column(String(100), ForeignKey("test_results.id"), nullable=True)
    match_status = Column(String(50), nullable=False) # Matched, Recorded Pending, Result not found, Needs review
    match_confidence = Column(Float, default=1.0)
    evidence = Column(Text, nullable=True)
    
    test_request = relationship("TestRequest", back_populates="links")
    test_result = relationship("TestResult", back_populates="links")

class Conflict(Base):
    __tablename__ = "conflicts"
    
    id = Column(String(100), primary_key=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    cycle_label = Column(String(50), default="Cycle 2")
    conflict_type = Column(String(100), default="Procedure Date Discrepancy") # Procedure Date, Dosage, Diagnosis
    fact_a = Column(Text, nullable=False)
    fact_b = Column(Text, nullable=False)
    source_a_doc = Column(String(255), nullable=False)
    source_a_page = Column(Integer, default=1)
    source_b_doc = Column(String(255), nullable=False)
    source_b_page = Column(Integer, default=1)
    status = Column(String(50), default="Needs Review") # Needs Review, Resolved_A, Resolved_B, Dismissed
    reviewed_by = Column(String(100), nullable=True)
    resolution_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="conflicts")

class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=True)
    action = Column(String(100), nullable=False) # AUTH_LOGIN, PATIENT_VIEW, RAG_QUERY, DOC_UPLOAD, CONFLICT_REVIEW, ACCESS_DENIED, RECONCILIATION_RUN
    resource = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(50), default="127.0.0.1")
    metadata_json = Column(Text, default="{}")
    
    user = relationship("User", back_populates="audit_events")
    patient = relationship("Patient", back_populates="audit_events")

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
