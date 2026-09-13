from typing import Optional, List
from pydantic import BaseModel, Field


class ComplaintForm(BaseModel):
    """Mirrors every field on the left-hand 'Log Customer Complaint' form."""

    customer_name: Optional[str] = None
    customer_type: Optional[str] = None  # Pharmacy / Distributor / Hospital / Patient ...
    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    dosage_form: Optional[str] = None  # Capsules / Tablets / API powder ...
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    affected_quantity: Optional[str] = None
    packaging_details: Optional[str] = None
    complaint_category: Optional[str] = None
    complaint_description: Optional[str] = None
    date_received: Optional[str] = None
    source_channel: Optional[str] = None


class RiskAssessment(BaseModel):
    severity: Optional[str] = None  # Critical / Major / Minor
    risk_score: Optional[int] = Field(default=None, ge=1, le=10)
    next_action: Optional[str] = None
    capa_recommendation: Optional[str] = None
    root_cause_hypothesis: Optional[str] = None
    summary: Optional[str] = None
    reasoning: Optional[str] = None


class CompletenessCheck(BaseModel):
    score: int = 0  # 0-100
    status: str = "Incomplete"  # Complete / Incomplete
    missing_fields: List[str] = []


class DuplicateMatch(BaseModel):
    complaint_id: str
    reason: str


class DuplicateCheck(BaseModel):
    is_duplicate: bool = False
    matches: List[DuplicateMatch] = []


class ChatRequest(BaseModel):
    message: str
    current_complaint: Optional[ComplaintForm] = None
    complaint_id: Optional[str] = None  # set once a record has been committed


class CommitRequest(BaseModel):
    """Body for POST /api/complaints/commit - the QA reviewer's explicit
    confirmation that the current draft (form + AI risk assessment) is
    accurate and should be written to the QMS ledger (Postgres)."""

    complaint_id: Optional[str] = None  # present when re-committing an edit
    complaint: ComplaintForm
    risk_assessment: RiskAssessment
    completeness: CompletenessCheck
    duplicate_check: DuplicateCheck


class ChatResponse(BaseModel):
    reply: str
    complaint: ComplaintForm
    risk_assessment: RiskAssessment
    completeness: CompletenessCheck
    duplicate_check: DuplicateCheck
    complaint_id: Optional[str] = None


class ComplaintRecord(ComplaintForm):
    complaint_id: str
    risk_assessment: Optional[RiskAssessment] = None
    completeness: Optional[CompletenessCheck] = None
    duplicate_check: Optional[DuplicateCheck] = None
