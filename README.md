<div align="center">

# 🧪 AIVOA — AI-Powered Customer Complaint Management System

**An AI-copilot-driven Customer Complaint module for a pharmaceutical (API + FDF) Quality Management System.**
Describe a complaint in plain language, or drop in a PDF/email — the AI Copilot fills the form and runs a first-pass GMP risk assessment for a QA reviewer to confirm.

[![CI](https://github.com/221fa04470/aivoa-complaint-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/221fa04470/aivoa-complaint-management-system/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/State-Redux%20Toolkit-764ABC?logo=redux&logoColor=white)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/Agent-LangGraph-1C3C3C)
![Groq](https://img.shields.io/badge/LLM-Groq-F55036)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

</div>

---

## 📋 Table of contents

- [Why this design](#-why-this-design)
- [Architecture](#-architecture)
- [Draft vs. committed complaints](#-draft-vs-committed-complaints)
- [Mandatory AI tools](#-mandatory-ai-tools-from-the-demo-video)
- [Bonus AI features](#-bonus-ai-features-implemented)
- [Tech stack](#-tech-stack)
- [Running it](#-running-it)
- [Project layout](#-project-layout)
- [Docs](#-docs)
- [Notes](#-notes)

---

## 💡 Why this design

In a pharma QMS, a Customer Complaint is the formal record that starts an
investigation (deviation → root cause → CAPA) whenever a customer reports a
quality issue with a batch. Speed and completeness of that first record
matter: a QA officer who has to manually transcribe a phone call or a PDF
into a form is slow and error-prone. This app lets them describe what
happened in plain language (or drop in the complaint document) and has the
AI do the transcription **and** a first-pass GMP risk read, which a human QA
reviewer then confirms.

## 🏗 Architecture

```
Browser (React + Redux)
   │  POST /api/chat            { message, current_complaint, complaint_id }
   │  POST /api/extract-document (multipart file)
   │  POST /api/complaints/commit (persist the reviewed draft)
   ▼
FastAPI
   │
   ▼
LangGraph agent  (app/agents/graph.py)
   router ─▶ extract_or_merge ─▶ completeness_check ─▶ check_duplicates ─▶ assess_risk ─▶ respond
   │              │                     │                     │                │
   │      Groq gpt-oss-20b        rule-based           Postgres query   Groq gpt-oss-120b
   │      (JSON-mode extraction)  (required-field       (product+batch/  (severity, next action,
   │                              completeness score)    customer match)  CAPA, root cause, summary)
   ▼
Postgres (via SQLAlchemy) — one row per complaint, written only on commit
```

- **router** decides `log` vs `edit` from whether a form is already in
  progress (an upload always forces `extract` mode).
- **extract_or_merge** is the one node that talks to the LLM to read the
  message and either populate a blank form or merge a correction into the
  existing one, preserving every field the user didn't just mention. It
  also normalizes common LLM quirks — nested wrapper objects, camelCase
  keys, numeric values where a string was expected — back into the exact
  shape the form needs.
- **completeness_check**, **check_duplicates**, and **assess_risk** are the
  bonus AI features (see below) — they always run, so every turn keeps the
  risk panel and completeness meter in sync with the form.

### Why two Groq models

The design uses a small, fast model for the structured extraction step and a
larger one only for the heavier risk-reasoning step — the assignment
explicitly allows a second, stronger model "for context" alongside the
mandatory one, and the extra reasoning quality there is worth the latency.

**A note on model names:** the assignment specifies `gemma2-9b-it` for
extraction and `llama-3.3-70b-versatile` for context. Both have since been
decommissioned by Groq (Groq deprecates models on a rolling basis). This repo
defaults to Groq's current recommended replacements, `openai/gpt-oss-20b`
(extraction) and `openai/gpt-oss-120b` (reasoning), configured via
`GROQ_EXTRACTION_MODEL` / `GROQ_REASONING_MODEL` in `backend/.env` so they're
a one-line change if Groq's lineup shifts again.

## 🔒 Draft vs. committed complaints

Matching the reference UI's "Commit to QMS Ledger" button: nothing is
written to Postgres while you're chatting with the copilot or correcting
fields — `/api/chat` and `/api/extract-document` only return the updated
draft (form + risk assessment) for the frontend to hold in Redux. The
complaint is only persisted when the user clicks **Commit to QMS Ledger**,
which calls `POST /api/complaints/commit`. This mirrors how a QA reviewer
actually works: draft, review the AI's read, then formally log it. Any
further AI-assisted edit after a commit re-opens the draft (the button
reads "Commit to QMS Ledger" again) rather than silently overwriting the
ledger.

## ✅ Mandatory AI tools (from the demo video)

| Demo tool | Implementation |
|---|---|
| **Log Complaint** (ChatGPT-style prompt → fills form) | `POST /api/chat` with an empty `current_complaint` → `router` picks `log` mode |
| **Edit Complaint** (natural-language correction, preserves other fields) | `POST /api/chat` with a populated `current_complaint` → `router` picks `edit` mode, `extract_or_merge` only overwrites the fields mentioned |
| **Document Extraction** (PDF/email upload → fills form) | `POST /api/extract-document`, parsed with `pdfplumber`, mode forced to `extract`; the result can still be corrected via chat afterwards, same as the log/edit tools |

Two sample documents are included for the extraction demo:
`backend/samples/customer_complaint_metformin.pdf` and
`backend/samples/customer_complaint_email.eml`.

## 🎁 Bonus AI features implemented

- **Complaint Completeness Checker** — flags missing required fields and
  shows a live completeness % on the risk panel.
- **Duplicate Complaint Detection** — checks the new complaint against
  existing committed records for the same product + batch, or same product +
  customer, and surfaces a warning banner.
- **CAPA Recommendation** — the risk-assessment LLM call proposes a
  Corrective and Preventive Action.
- **Root Cause Recommendation** — same call proposes a likely root-cause
  category (e.g. "Manufacturing process deviation").
- **Complaint Summary + AI Risk Classification** — severity (Critical /
  Major / Minor), a 1–10 risk score, a QA-style next action, and a short
  human-readable summary and reasoning.

## 🛠 Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Redux Toolkit (Vite) |
| Backend | FastAPI |
| AI agent framework | LangGraph |
| LLMs | Groq `openai/gpt-oss-20b` (extraction) + `openai/gpt-oss-120b` (risk reasoning) |
| Database | PostgreSQL (SQLAlchemy ORM) |
| Font | Google Inter |
| Containerization | Docker Compose |

## 🚀 Running it

### Option A — Docker Compose (recommended)

```bash
cp backend/.env.example backend/.env
# edit backend/.env and paste your Groq API key (https://console.groq.com)

docker compose up --build
```

- Frontend: http://localhost:5173
- Backend docs: http://localhost:8000/docs

### Option B — run locally

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your GROQ_API_KEY; DATABASE_URL defaults to sqlite for quick local testing
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project layout

```
backend/
  app/
    agents/        # LangGraph state, nodes, prompts, compiled graph
    models/        # SQLAlchemy Complaint model
    routers/       # /api/chat, /api/extract-document, /api/complaints (+ /commit)
    schemas/       # Pydantic request/response models
    services/      # document parsing, complaint upsert helper
    tools/         # Groq client wrapper
  samples/         # sample complaint PDF + email for the extraction demo
frontend/
  src/
    components/    # ComplaintForm, CopilotChat, RiskAssessmentPanel
    store/         # Redux Toolkit slice + async thunks
    api/           # axios client
    fieldConfig.js # single source of truth for form fields/sections
docs/              # demo video scripts (product demo + code walkthrough)
.github/workflows/ # CI: frontend build + backend import check
```

## 📚 Docs

- [`docs/demo-video-scripts-outline.md`](docs/demo-video-scripts-outline.md) — beat-by-beat outline for both submission videos
- [`docs/code-walkthrough-full-narration.md`](docs/code-walkthrough-full-narration.md) — full spoken narration script for the code-walkthrough video

## 📝 Notes

- The left form's inputs are intentionally read-only — per the demo video,
  it must only ever be filled by the AI Copilot, never typed into directly.
- OCR/production-grade document parsing is out of scope per the assignment;
  `pdfplumber` text extraction is sufficient for the sample documents
  provided.
- `DATABASE_URL=sqlite:///./aivoa.db` also works if you want to try the
  backend without standing up Postgres first.

---

<div align="center">

Built by [Harsha Reddy](https://github.com/221fa04470) for AIVOA's Round 1 AI Product Engineer (Interns) challenge.

</div>
