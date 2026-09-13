# AIVOA Submission — Video Scripts

Two videos, as required: **(1) Product Demo** and **(2) Code Walkthrough**.
Keep both screen-recorded, 5–10 min each. Talk naturally from these beats —
don't read verbatim.

---

## Video 1 — Product Demo (5–7 min)

**Goal:** prove every mandatory AI tool + bonus feature works, matching the reference demo video.

### 1. Intro (30s)
- "This is my submission for the AIVOA Customer Complaint Management System — a QMS complaint module for pharma manufacturing, built with React/Redux, FastAPI, LangGraph, and Groq."
- Show the running app: left = Log Customer Complaint form (empty), right = AI Copilot.
- Call out: "The form is read-only by design — only the AI Copilot fills it, per the assignment."

### 2. Tool 1 — Log Complaint (90s)
- Type in the chat: `Apollo Pharmacy reported discolored capsules in Amoxicillin capsules 500 mg`
- While it loads: "This goes through a LangGraph pipeline — the router detects there's no complaint in progress, so it's a fresh 'log' operation."
- Point out on screen:
  - Left form auto-fills (customer name, product, strength, category, description) — highlighted fields flash teal.
  - Risk panel: severity badge (Major), next action, CAPA, root cause, completeness %.
  - Completeness meter shows missing fields (batch number, quantity) — call this out as the **Completeness Checker bonus feature**.

### 3. Tool 2 — Edit Complaint (60s)
- Type: `Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules`
- Show: batch number + quantity now filled, **everything else preserved** (customer, product, category untouched).
- Completeness meter jumps to 100%, status → Complete.
- "This is the edit tool — it merges the correction into the existing form instead of starting over."

### 4. Tool 3 — Document Extraction (90s)
- Click the attach icon, upload `backend/samples/customer_complaint_metformin.pdf`.
- Show the form populate fresh: Metformin Hydrochloride API, IP/BP grade, batch MFH260712A, quantities, etc.
- Show the risk panel re-run for this new complaint.
- Then correct it via chat: `Sorry, the batch number is CHG260712A and affected quantity is 50 kg 2 HDPE drums` — show it update those two fields only.
- Optional: repeat quickly with `customer_complaint_email.eml` to show it isn't PDF-only.

### 5. Bonus features recap (60–90s)
- **Duplicate detection**: log a second complaint for the same product/batch as an earlier one and show the amber duplicate banner appear. (Easiest: re-run the Amoxicillin/BMX24602 example a second time as a brand-new complaint.)
- **CAPA / Root cause / Risk classification / Summary**: point at the risk panel fields already visible from steps 2–4 and name each one explicitly so the grader can map it to the assignment's bonus list.

### 5b. Commit to QMS Ledger (30s)
- Point out the complaint badge in the header still says "No complaint logged yet" even though the form and risk panel are fully populated — nothing is written to the database until reviewed.
- Click **Commit to QMS Ledger**. Show the header badge update with a real complaint ID, and the button switch to "Committed to QMS Ledger ✓".
- "This matches how a QA reviewer actually works — draft, review the AI's read, then formally log it. The button also re-appears if you edit the complaint again after committing, so nothing gets silently overwritten in the ledger."

### 6. Close (15s)
- "That covers all three mandatory AI tools and five bonus features — code walkthrough is in the second video."

---

## Video 2 — Code Walkthrough (7–10 min)

**Goal:** trace one complete request end-to-end, per the assignment's explicit ask: frontend input → API endpoint → backend processing → LangGraph workflow → response → form/risk panel.

### 1. Frontend entry point (90s)
- Open `frontend/src/components/CopilotChat.jsx` — show `handleSend`, dispatching the `sendMessage` thunk.
- Open `frontend/src/store/complaintSlice.js`:
  - `sendMessage` thunk — show it reads current `complaint` + `complaintId` from Redux state and calls `sendChat`.
  - `applyResponse` — show how the API response overwrites `complaint`, `riskAssessment`, `completeness`, `duplicateCheck`, and computes `highlightedFields` via `diffChangedFields` (this is what drives the teal flash on changed fields in `ComplaintForm.jsx`).
- Open `frontend/src/api/client.js` — show the plain axios POST to `/api/chat`.

### 2. API endpoint (75s)
- Open `backend/app/routers/chat.py`.
- Walk through `ChatRequest` (message, current_complaint, complaint_id) → builds the LangGraph `initial_state` → invokes `complaint_agent_graph` → returns `ChatResponse`. Point out this endpoint does **not** touch Postgres — it's draft-only.
- Open `backend/app/routers/complaints.py`'s `commit_complaint` — this is what actually calls `upsert_complaint` and writes the row, triggered only by the "Commit to QMS Ledger" button click on the frontend.

### 3. LangGraph workflow (3–4 min — this is the core)
- Open `backend/app/agents/graph.py` — show the six-node chain: `router → extract_or_merge → completeness_check → check_duplicates → assess_risk → respond`. Explain it's a linear `StateGraph`, no branching needed because mode is decided once at the start.
- Open `backend/app/agents/nodes.py` node by node:
  - `router_node` — log vs edit decision based on whether `current_complaint` already has data.
  - `extract_or_merge_node` — the Groq extraction-model call (`app/tools/groq_client.py::call_json`, JSON mode). Show the prompt in `app/agents/prompts.py` (`EXTRACTION_SYSTEM_PROMPT`) and explain the merge logic: existing fields are kept unless the new message overwrites them.
  - `completeness_node` — rule-based check against `COMPLETENESS_REQUIRED_FIELDS`.
  - `duplicate_check_node` — Postgres query in `models/complaint.py`'s `Complaint` table, matching on product+batch or product+customer.
  - `risk_assessment_node` — the Groq reasoning-model call using `RISK_SYSTEM_PROMPT`, producing severity/next action/CAPA/root cause/summary/reasoning.
  - `respond_node` — assembles the natural-language chat reply shown in the UI.
- Explicitly say why two models: a small fast model (mandatory-slot) for structured extraction, a larger one for the heavier risk reasoning — both allowed per the assignment brief.
- **Worth calling out on camera:** the assignment names `gemma2-9b-it` and `llama-3.3-70b-versatile` specifically, but Groq has since decommissioned both. Mention that you noticed this, checked Groq's current model list, and swapped in `openai/gpt-oss-20b` / `openai/gpt-oss-120b` as drop-in replacements via an env var — this is a good, honest way to show the "curiosity and problem-solving" the assignment says it's grading for.

### 4. Document extraction path (60s)
- Open `backend/app/routers/documents.py` and `backend/app/services/document_parser.py` — show `pdfplumber` extracting raw text, then the same graph invoked with `mode="extract"` so it reuses every downstream node.

### 5. Back to the frontend — closing the loop (30s)
- Show `ChatResponse` landing back in `applyResponse`, and the `ComplaintForm.jsx` / `RiskAssessmentPanel.jsx` components rendering straight from Redux state — no local component state, everything is one source of truth.

### 6. Close (15s)
- "That's the full round trip — prompt or document in, LangGraph reasoning, form and risk panel out."

---

## Recording tips
- Zoom your editor font size up before recording — reviewers will pause on code frames.
- Keep the app and the two source files open in different windows/tabs so the demo → code cut is fast.
- If a Groq call is slow/rate-limited on camera, it's fine to say so and cut to a pre-recorded successful run for that one step.
