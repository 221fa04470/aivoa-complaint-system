from sqlalchemy.orm import Session

from app.models.complaint import Complaint, gen_id
from app.agents.nodes import FORM_FIELDS


def upsert_complaint(db: Session, complaint_id: str | None, complaint: dict,
                      risk_assessment: dict, completeness: dict, duplicate_check: dict) -> Complaint:
    record = None
    if complaint_id:
        record = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()

    if record is None:
        record = Complaint(complaint_id=complaint_id or gen_id())
        db.add(record)

    for field in FORM_FIELDS:
        setattr(record, field, complaint.get(field))

    record.risk_assessment = risk_assessment
    record.completeness = completeness
    record.duplicate_check = duplicate_check

    db.commit()
    db.refresh(record)
    return record


def record_to_dict(record: Complaint) -> dict:
    return {field: getattr(record, field) for field in FORM_FIELDS} | {
        "complaint_id": record.complaint_id,
        "risk_assessment": record.risk_assessment,
        "completeness": record.completeness,
        "duplicate_check": record.duplicate_check,
    }
