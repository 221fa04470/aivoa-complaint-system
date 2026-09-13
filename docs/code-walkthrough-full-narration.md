# Video 2 — Code Walkthrough: Full Narration Script

Read this loosely, in your own words — it's written as full sentences so you
never go blank on camera, but don't recite it robotically. Have these files
open in tabs before you hit record, in this order:

1. `frontend/src/components/CopilotChat.jsx`
2. `frontend/src/store/complaintSlice.js`
3. `frontend/src/api/client.js`
4. `backend/app/routers/chat.py`
5. `backend/app/routers/complaints.py`
6. `backend/app/agents/graph.py`
7. `backend/app/agents/nodes.py`
8. `backend/app/agents/prompts.py`
9. `backend/app/routers/documents.py`
10. `backend/app/services/document_parser.py`

Total target length: 7–10 minutes.

---

## 0. Cold open (10s)

> "In this video I'll trace one complete request end-to-end — from typing a
> complaint in the chat, through the API, through the LangGraph agent, and
> back to the form and risk panel on screen."

---

## 1. Frontend entry point (~90s)

**Open `CopilotChat.jsx`.**

> "This is the AI Copilot chat component. When I type a message and hit
> send, `handleSend` fires, which dispatches a Redux thunk called
> `sendMessage` with the raw text."

Point at the `handleSend` function on screen.

**Switch to `complaintSlice.js`.**

> "This is the Redux Toolkit slice that owns all the state for this app —
> the complaint form, the risk assessment, the chat history, everything.
> `sendMessage` is an async thunk. Before it calls the API, it reads the
> *current* complaint and complaint ID out of Redux state, because the
> backend needs to know what's already been filled in so it can merge
> corrections instead of starting over."

Point at the `sendMessage` thunk body — specifically `getState().complaint`.

> "Once the API responds, `applyResponse` runs. It overwrites `complaint`,
> `riskAssessment`, `completeness`, and `duplicateCheck` with whatever the
> backend sent back, and it computes `highlightedFields` by diffing the old
> complaint against the new one — that's what makes changed fields flash
> teal in the form. Nothing in this component keeps its own local state;
> everything renders straight from this one Redux store."

**Switch to `api/client.js`.**

> "And this is the actual HTTP call — a plain axios POST to `/api/chat`,
> sending the message, the current complaint, and the complaint ID."

---

## 2. API layer — draft vs. commit (~75s)

**Open `backend/app/routers/chat.py`.**

> "On the backend, this is the `/api/chat` endpoint. It takes that request,
> builds an initial state dictionary for the LangGraph agent — message,
> current complaint, complaint ID, and a database session — and invokes the
> compiled graph. Notice this endpoint does **not** touch Postgres. It's
> intentionally draft-only: everything it returns just goes back into Redux
> on the frontend."

**Open `backend/app/routers/complaints.py`.**

> "Persistence only happens here, in `commit_complaint`. This is what runs
> when the user clicks 'Commit to QMS Ledger' on the form. It takes the
> current draft — the complaint fields, the risk assessment, the
> completeness check, the duplicate check — and upserts it into Postgres as
> one row. I did this deliberately to mirror how a QA reviewer actually
> works in real life: draft with the AI, review its reasoning, and only
> then formally log it into the system of record."

---

## 3. The LangGraph agent (~3.5–4 min — this is the core of the video)

**Open `backend/app/agents/graph.py`.**

> "This is the actual LangGraph agent. It's a linear `StateGraph` with six
> nodes: `router`, `extract_or_merge`, `completeness_check`,
> `check_duplicates`, `assess_risk`, and `respond`. No branching logic is
> needed because the mode — log, edit, or extract — gets decided once at
> the very start and carried through the rest of the graph as shared
> state."

Trace the `add_edge` calls with your cursor as you say this, so the linear
chain is visually obvious.

**Switch to `backend/app/agents/nodes.py`.** Go through each node in order:

### router_node

> "First, `router_node`. If this came from a document upload, the mode is
> already forced to `extract` and this node is a no-op. Otherwise, it looks
> at whatever complaint data is already in progress — deliberately ignoring
> the internal `source_channel` bookkeeping field — and decides: is this a
> brand-new complaint, or is the user correcting one that's already
> started? That's the difference between the 'Log Complaint' and 'Edit
> Complaint' tools from the assignment brief — they're actually the same
> code path, just with a different starting state."

### extract_or_merge_node

> "This is the one node in the whole graph that actually talks to an LLM
> for extraction. It builds a prompt containing the existing form state as
> JSON, plus the new message, and sends it to Groq in JSON mode using
> `call_json`. The system prompt — over in `prompts.py` — explicitly tells
> the model to keep every field the new message doesn't mention, and only
> overwrite the ones it does. That's how a correction like 'the batch
> number is X' updates just that one field instead of wiping out
> everything else."

> "One thing worth calling out: smaller LLMs don't always follow
> instructions to the letter. I added a `_normalize_extracted` helper here
> that tolerates the model wrapping fields in a nested object, or using
> camelCase instead of snake_case — it flattens and re-maps keys back to
> what the rest of the app expects. I also coerce every value to a string,
> because the model occasionally returns something like `affected_quantity:
> 12` as a JSON number instead of a string, which would otherwise fail
> Pydantic validation downstream."

### completeness_node

> "Next, `completeness_node` — this is the Completeness Checker bonus
> feature. It's pure rule-based logic, no LLM call: it checks the complaint
> against a fixed list of required fields and computes a percentage plus a
> list of what's still missing."

### duplicate_check_node

> "Then `check_duplicates` — the Duplicate Detection bonus feature. This
> queries Postgres directly for other committed complaints on the same
> product, and flags a match if they also share a batch number or a
> customer. Also rule-based, no LLM involved — duplicate detection doesn't
> need reasoning, just a database lookup."

### risk_assessment_node

> "Then `assess_risk` — this is the second and last LLM call in the graph,
> and it's where the CAPA Recommendation, Root Cause Recommendation, and
> Risk Classification bonus features all come from. It sends the complaint,
> the completeness result, and the duplicate check to Groq with a
> QA-officer-style system prompt, asking for a severity rating, a risk
> score, a next action, a CAPA recommendation, a root cause hypothesis, a
> summary, and the reasoning behind all of it."

> "Quick note on why there are two different Groq models in this app: the
> extraction step is a fast, structured, low-temperature JSON task, so it
> uses a smaller model. The risk-assessment step needs actual reasoning
> quality, so it uses a larger one — the assignment explicitly allows a
> second model 'for context' alongside the mandatory one."

> "Also worth mentioning here: the assignment specifies `gemma2-9b-it` and
> `llama-3.3-70b-versatile` by name, but Groq has since decommissioned both
> of them. I noticed this while testing, checked Groq's current model list,
> and swapped in their recommended replacements — configured through
> environment variables so it's a one-line change if Groq's lineup shifts
> again before this gets reviewed."

### respond_node

> "Finally, `respond_node` just assembles the plain-English chat reply you
> see in the UI, pulling together the mode, the product name, the severity,
> and anything missing or duplicated — no LLM call needed for this one
> either, it's just string formatting from everything the earlier nodes
> already computed."

---

## 4. Document extraction path (~45–60s)

**Open `backend/app/routers/documents.py`.**

> "The third mandatory tool — document extraction — reuses this exact same
> graph. `/api/extract-document` just runs `pdfplumber` to pull raw text
> out of an uploaded PDF or email —"

**Briefly show `backend/app/services/document_parser.py`.**

> "— here's that extraction helper — and then feeds that text into the
> graph with `mode` forced to `extract`. Every downstream node —
> completeness, duplicates, risk assessment — runs exactly the same way
> whether the complaint came from a typed prompt or a parsed document."

---

## 5. Closing the loop (~30s)

**Back to `complaintSlice.js` / mention `ComplaintForm.jsx` and
`RiskAssessmentPanel.jsx` without necessarily opening them.**

> "And that response lands back in `applyResponse` on the frontend, which
> updates Redux state. The form and risk panel components don't hold any
> logic of their own — they just render straight from that one Redux
> store, so the whole UI stays in sync automatically."

---

## 6. Close (10s)

> "So that's the full round trip: a prompt or a document goes in, it runs
> through a six-node LangGraph pipeline with two Groq calls and two
> rule-based checks, and a filled-out form plus a full risk assessment
> comes out the other side."

---

## Delivery tips
- Say the node names out loud exactly as they appear in code
  (`extract_or_merge`, `check_duplicates`, `assess_risk`) — it makes it
  obvious to the grader that you're narrating real code, not a diagram.
- If you stumble on a section, it's fine to cut and re-record just that
  segment — you don't need one unbroken take.
- Keep your cursor moving to whatever you're currently talking about; a
  static screen while narrating a different function is the easiest way to
  lose the viewer.
