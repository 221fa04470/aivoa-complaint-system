import json
import logging

from app.config import settings
from app.tools.groq_client import call_json
from app.agents.state import ComplaintAgentState
from app.agents.prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
    RISK_SYSTEM_PROMPT,
    COMPLETENESS_REQUIRED_FIELDS,
)
from app.models.complaint import Complaint

logger = logging.getLogger("aivoa.nodes")

FORM_FIELDS = [
    "customer_name", "customer_type", "product_name", "product_strength", "dosage_form",
    "batch_number", "manufacturing_date", "expiry_date", "affected_quantity",
    "packaging_details", "complaint_category", "complaint_description", "date_received",
    "source_channel",
]

# Some models occasionally wrap the fields in a container key, or vary casing
# (camelCase) instead of the exact snake_case keys we asked for. This maps
# every "flattened, lowercased, no-underscore" variant back to our real key,
# so extraction still works even if the model doesn't follow instructions
# to the letter.
_NORMALIZED_LOOKUP = {f.replace("_", "").lower(): f for f in FORM_FIELDS}


def _normalize_extracted(extracted: dict) -> dict:
    """Best-effort recovery of our exact field names from whatever shape the
    LLM actually returned (nested wrapper object, camelCase keys, etc.)."""
    if not isinstance(extracted, dict):
        return {}

    # If the whole payload is nested one level down (e.g. {"complaint": {...}}
    # or {"fields": {...}}), unwrap it before matching keys.
    if len(extracted) == 1:
        only_value = next(iter(extracted.values()))
        if isinstance(only_value, dict):
            extracted = only_value

    normalized = {}
    for key, value in extracted.items():
        real_key = _NORMALIZED_LOOKUP.get(str(key).replace("_", "").lower())
        if real_key:
            normalized[real_key] = value
    return normalized


def router_node(state: ComplaintAgentState) -> ComplaintAgentState:
    """Decide whether this turn is logging a brand-new complaint or editing one
    already in progress. Document-extraction requests set mode='extract'
    upfront and skip this decision."""
    if state.get("mode") == "extract":
        return state

    current = state.get("current_complaint") or {}
    meaningful_fields = [f for f in FORM_FIELDS if f != "source_channel"]
    has_existing_data = any(current.get(f) for f in meaningful_fields)
    state["mode"] = "edit" if has_existing_data else "log"
    return state


def extract_or_merge_node(state: ComplaintAgentState) -> ComplaintAgentState:
    current = state.get("current_complaint") or {}
    system_prompt = (
        DOCUMENT_EXTRACTION_SYSTEM_PROMPT if state["mode"] == "extract" else EXTRACTION_SYSTEM_PROMPT
    )
    user_prompt = (
        f"EXISTING FORM STATE (JSON, may be empty):\n{json.dumps(current)}\n\n"
        f"NEW {'DOCUMENT TEXT' if state['mode'] == 'extract' else 'MESSAGE'}:\n{state['message']}"
    )
    raw_extracted = call_json(system_prompt, user_prompt, model=settings.GROQ_EXTRACTION_MODEL)
    extracted = _normalize_extracted(raw_extracted)
    logger.info("EXTRACTED (normalized): %s", extracted)

    merged = dict(current)
    for field in FORM_FIELDS:
        value = extracted.get(field)
        if value not in (None, "", "null"):
            # Groq occasionally returns numeric-looking fields (e.g. affected_quantity)
            # as a JSON number rather than a string - every form field is a string.
            merged[field] = value if isinstance(value, str) else str(value)
    if not merged.get("source_channel"):
        merged["source_channel"] = {"extract": "document"}.get(state["mode"], "prompt")

    state["complaint"] = merged
    return state


def completeness_node(state: ComplaintAgentState) -> ComplaintAgentState:
    complaint = state["complaint"]
    missing = [f for f in COMPLETENESS_REQUIRED_FIELDS if not complaint.get(f)]
    score = round(100 * (len(COMPLETENESS_REQUIRED_FIELDS) - len(missing)) / len(COMPLETENESS_REQUIRED_FIELDS))
    state["completeness"] = {
        "score": score,
        "status": "Complete" if not missing else "Incomplete",
        "missing_fields": missing,
    }
    return state


def duplicate_check_node(state: ComplaintAgentState) -> ComplaintAgentState:
    complaint = state["complaint"]
    db = state.get("db")
    matches = []

    if db is not None and complaint.get("product_name"):
        query = db.query(Complaint)
        exclude_id = state.get("complaint_id")
        if exclude_id:
            query = query.filter(Complaint.complaint_id != exclude_id)

        candidates = query.filter(Complaint.product_name.isnot(None)).all()
        product = (complaint.get("product_name") or "").strip().lower()
        batch = (complaint.get("batch_number") or "").strip().lower()
        customer = (complaint.get("customer_name") or "").strip().lower()

        for c in candidates:
            c_product = (c.product_name or "").strip().lower()
            if not c_product or product not in c_product and c_product not in product:
                continue
            c_batch = (c.batch_number or "").strip().lower()
            c_customer = (c.customer_name or "").strip().lower()

            if batch and c_batch and batch == c_batch:
                matches.append({
                    "complaint_id": c.complaint_id,
                    "reason": f"Same product ({c.product_name}) and same batch number ({c.batch_number}).",
                })
            elif customer and c_customer and customer == c_customer:
                matches.append({
                    "complaint_id": c.complaint_id,
                    "reason": f"Same product ({c.product_name}) reported by the same customer ({c.customer_name}).",
                })

    state["duplicate_check"] = {"is_duplicate": len(matches) > 0, "matches": matches}
    return state


def risk_assessment_node(state: ComplaintAgentState) -> ComplaintAgentState:
    payload = {
        "complaint": state["complaint"],
        "completeness": state["completeness"],
        "duplicate_check": state["duplicate_check"],
    }
    risk = call_json(
        RISK_SYSTEM_PROMPT,
        json.dumps(payload),
        model=settings.GROQ_REASONING_MODEL,
        temperature=0.3,
    )
    state["risk_assessment"] = risk
    return state


def respond_node(state: ComplaintAgentState) -> ComplaintAgentState:
    complaint = state["complaint"]
    risk = state["risk_assessment"]
    completeness = state["completeness"]
    dup = state["duplicate_check"]

    verb = {"log": "Logged", "edit": "Updated", "extract": "Extracted"}[state["mode"]]
    parts = [
        f"{verb} the complaint for {complaint.get('product_name') or 'the product'} "
        f"({complaint.get('customer_name') or 'customer not yet specified'})."
    ]
    if risk.get("severity"):
        parts.append(f"AI Copilot classified this as **{risk['severity']}** severity — {risk.get('next_action', '')}.")
    if completeness.get("status") == "Incomplete":
        parts.append(f"Still missing: {', '.join(completeness['missing_fields'])}.")
    if dup.get("is_duplicate"):
        parts.append(f"⚠ Possible duplicate of {', '.join(m['complaint_id'] for m in dup['matches'])}.")

    state["reply"] = " ".join(parts)
    return state
