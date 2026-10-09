from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.reconciliation.test_matching import TestMatchingEngine
from backend.app.reconciliation.cycle_comparison import CycleComparisonEngine
from backend.app.reconciliation.conflict_detection import ConflictDetectionService
from backend.app.reconciliation.change_detection import ChangeDetectionService

class ReconciliationService:
    @staticmethod
    def get_test_reconciliation(db: Session, patient_id: str):
        return TestMatchingEngine.compute_reconciliation(db, patient_id)
        
    @staticmethod
    def compare_cycles(db: Session, patient_id: str):
        return CycleComparisonEngine.compare_cycles(db, patient_id)
        
    @staticmethod
    def get_conflicts(db: Session, patient_id: str):
        return ConflictDetectionService.list_conflicts(db, patient_id)
        
    @staticmethod
    def get_changes(db: Session, patient_id: str):
        return ChangeDetectionService.get_patient_changes_summary(db, patient_id)

__all__ = ["ReconciliationService"]
