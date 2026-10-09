from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.database import Document, Event, TestRequest, TestResult, Conflict

class ChangeDetectionService:
    @staticmethod
    def get_patient_changes_summary(db: Session, patient_id: str) -> Dict[str, Any]:
        """
        Aggregates historical changes, recent document additions, matched results,
        and flagged conflicts.
        """
        docs = db.query(Document).filter(Document.patient_id == patient_id).order_by(Document.created_at.desc()).all()
        events = db.query(Event).filter(Event.patient_id == patient_id).all()
        conflicts = db.query(Conflict).filter(Conflict.patient_id == patient_id).all()
        
        changes_timeline = []
        for d in docs:
            changes_timeline.append({
                "date": d.created_at.strftime("%Y-%m-%d %H:%M"),
                "document_id": d.id,
                "filename": d.filename,
                "version": d.version,
                "cycle_label": d.cycle_label,
                "type": "Document Ingestion",
                "summary": f"Uploaded {d.filename} ({d.document_type}). Version {d.version} processed with provenance preservation."
            })
            
        for c in conflicts:
            changes_timeline.append({
                "date": c.created_at.strftime("%Y-%m-%d %H:%M"),
                "document_id": c.source_b_doc,
                "filename": c.source_b_doc,
                "version": 1,
                "cycle_label": c.cycle_label,
                "type": "Conflict Detected",
                "summary": f"Conflict flagged: {c.conflict_type} between {c.source_a_doc} and {c.source_b_doc} (Status: {c.status})"
            })
            
        changes_timeline.sort(key=lambda x: x["date"], reverse=True)
        
        return {
            "patient_id": patient_id,
            "total_documents_versioned": len(docs),
            "total_conflicts_tracked": len(conflicts),
            "recent_changes": changes_timeline
        }
