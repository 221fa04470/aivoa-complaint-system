from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.complaint import Complaint
from app.schemas.complaint import CommitRequest, ComplaintRecord
from app.services.complaint_service import upsert_complaint, record_to_dict

router = APIRouter(prefix="/api", tags=["complaints"])


@router.post("/complaints/commit", response_model=ComplaintRecord)
def commit_complaint(request: CommitRequest, db: Session = Depends(get_db)):
    """Writes the current draft to the QMS ledger (Postgres). This is the
    'Commit to QMS Ledger' action from the reference UI - nothing is
    persisted before this is called."""
    record = upsert_complaint(
        db,
        request.complaint_id,
        request.complaint.model_dump(),
        request.risk_assessment.model_dump(),
        request.completeness.model_dump(),
        request.duplicate_check.model_dump(),
    )
    return record_to_dict(record)


@router.get("/complaints")
def list_complaints(db: Session = Depends(get_db)):
    records = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return [record_to_dict(r) for r in records]


@router.get("/complaints/{complaint_id}")
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    record = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return record_to_dict(record)
