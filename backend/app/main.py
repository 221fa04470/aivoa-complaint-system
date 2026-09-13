from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import chat, documents, complaints

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AIVOA Customer Complaint Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(complaints.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
