from typing import Any, Optional, TypedDict


class ComplaintAgentState(TypedDict, total=False):
    mode: str  # "log" | "edit" | "extract"
    message: str  # user's natural-language prompt (or extracted document text)
    current_complaint: dict  # form state before this turn (may be {})
    complaint: dict  # form state after extraction/merge this turn
    completeness: dict
    duplicate_check: dict
    risk_assessment: dict
    reply: str
    db: Any  # SQLAlchemy session, injected per-request (not persisted/checkpointed)
