from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, Event, Document
from backend.app.auth.guards import require_patient_access
from backend.app.schemas.event import EventResponse

router = APIRouter(prefix="/patients/{patient_id}/timeline", tags=["Timeline"])

@router.get("", response_model=List[EventResponse])
def get_patient_timeline(
    patient_id: str = Depends(require_patient_access),
    db: Session = Depends(get_db)
):
    events = db.query(Event).filter(Event.patient_id == patient_id).order_by(Event.event_date.asc()).all()
    return events
