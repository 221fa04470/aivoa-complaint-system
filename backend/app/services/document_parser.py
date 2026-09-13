import io

import pdfplumber
from fastapi import UploadFile


async def extract_text(file: UploadFile) -> str:
    """Best-effort text extraction. Production-grade OCR/parsing is explicitly
    out of scope per the assignment brief - this handles the common cases
    (PDF complaint letters, .eml/.txt emails) well enough for a demo."""
    raw = await file.read()
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf") or file.content_type == "application/pdf":
        text_parts = []
        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts).strip()

    # .eml / .txt / anything else: treat as plain text
    try:
        return raw.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""
