from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.core.database import Patient, PatientGrant, Document, Event, TestRequest, TestResult, Conflict

class PatientRepository:
    @staticmethod
    def get_by_id(db: Session, patient_id: str) -> Optional[Patient]:
        return db.query(Patient).filter(Patient.id == patient_id).first()
        
    @staticmethod
    def list_all(db: Session) -> List[Patient]:
        return db.query(Patient).all()
        
    @staticmethod
    def list_authorized(db: Session, user_id: int) -> List[Patient]:
        return db.query(Patient).join(PatientGrant, PatientGrant.patient_id == Patient.id)\
            .filter(PatientGrant.user_id == user_id).all()
            
    @staticmethod
    def get_documents(db: Session, patient_id: str) -> List[Document]:
        return db.query(Document).filter(Document.patient_id == patient_id).order_by(Document.created_at.desc()).all()
        
    @staticmethod
    def get_events(db: Session, patient_id: str) -> List[Event]:
        return db.query(Event).filter(Event.patient_id == patient_id).order_by(Event.event_date.asc()).all()
        
    @staticmethod
    def get_conflicts(db: Session, patient_id: str) -> List[Conflict]:
        return db.query(Conflict).filter(Conflict.patient_id == patient_id).order_by(Conflict.created_at.desc()).all()
