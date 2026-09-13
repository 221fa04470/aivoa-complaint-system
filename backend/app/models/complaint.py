import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, JSON

from app.database import Base


def gen_id() -> str:
    return f"CC-{uuid.uuid4().hex[:8].upper()}"


class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(String, primary_key=True, default=gen_id)

    # --- Log Customer Complaint form fields ---
    customer_name = Column(String, nullable=True)
    customer_type = Column(String, nullable=True)
    product_name = Column(String, nullable=True)
    product_strength = Column(String, nullable=True)
    dosage_form = Column(String, nullable=True)
    batch_number = Column(String, nullable=True)
    manufacturing_date = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    affected_quantity = Column(String, nullable=True)
    packaging_details = Column(String, nullable=True)
    complaint_category = Column(String, nullable=True)
    complaint_description = Column(String, nullable=True)
    date_received = Column(String, nullable=True)
    source_channel = Column(String, nullable=True)  # prompt / email / pdf

    # --- AI Copilot outputs, stored as JSON blobs ---
    risk_assessment = Column(JSON, nullable=True)
    completeness = Column(JSON, nullable=True)
    duplicate_check = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
