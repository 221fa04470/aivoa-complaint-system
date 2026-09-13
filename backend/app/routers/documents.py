from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.complaint import ChatResponse
from app.agents.graph import complaint_agent_graph
from app.services.document_parser import extract_text

router = APIRouter(prefix="/api", tags=["documents"])


@router.post("/extract-document", response_model=ChatResponse)
async def extract_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Extracts a fresh draft complaint from an uploaded PDF/email. Like the
    chat tool, this is draft-only - it isn't written to Postgres until the
    user clicks 'Commit to QMS Ledger'."""
    text = await extract_text(file)

    initial_state = {
        "mode": "extract",
        "message": text,
        "current_complaint": {},
        "complaint_id": None,
        "db": db,
    }

    result = complaint_agent_graph.invoke(initial_state)

    return ChatResponse(
        reply=result["reply"],
        complaint=result["complaint"],
        risk_assessment=result["risk_assessment"],
        completeness=result["completeness"],
        duplicate_check=result["duplicate_check"],
        complaint_id=None,
    )
