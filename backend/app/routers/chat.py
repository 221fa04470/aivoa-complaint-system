from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.complaint import ChatRequest, ChatResponse
from app.agents.graph import complaint_agent_graph

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Log/edit a complaint via natural language. This only updates the
    in-progress draft (form + risk panel) - nothing is written to Postgres
    until the QA reviewer clicks 'Commit to QMS Ledger' (see complaints.py)."""
    initial_state = {
        "mode": "",  # decided by router_node
        "message": request.message,
        "current_complaint": request.current_complaint.model_dump() if request.current_complaint else {},
        "complaint_id": request.complaint_id,
        "db": db,  # still needed for the duplicate-check node to query committed records
    }

    result = complaint_agent_graph.invoke(initial_state)

    return ChatResponse(
        reply=result["reply"],
        complaint=result["complaint"],
        risk_assessment=result["risk_assessment"],
        completeness=result["completeness"],
        duplicate_check=result["duplicate_check"],
        complaint_id=request.complaint_id,  # unchanged until committed
    )
