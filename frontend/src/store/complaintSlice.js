import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { sendChat, extractDocument, commitComplaint } from "../api/client";
import { ALL_FIELD_KEYS } from "../fieldConfig";

const emptyComplaint = Object.fromEntries(ALL_FIELD_KEYS.map((k) => [k, null]));

const initialState = {
  complaintId: null,
  complaint: emptyComplaint,
  riskAssessment: {},
  completeness: { score: 0, status: "Incomplete", missing_fields: [] },
  duplicateCheck: { is_duplicate: false, matches: [] },
  messages: [
    {
      role: "assistant",
      text:
        "Ready to process new complaints. Paste the raw email or complaint description from the " +
        "customer, or upload a PDF of the complaint report — I'll extract the data and run the " +
        "initial risk assessment.",
    },
  ],
  status: "idle", // idle | loading | error
  error: null,
  highlightedFields: [],
  isCommitted: false, // true right after a successful "Commit to QMS Ledger"
};

function diffChangedFields(before, after) {
  return ALL_FIELD_KEYS.filter((k) => (before?.[k] ?? null) !== (after?.[k] ?? null));
}

export const sendMessage = createAsyncThunk(
  "complaint/sendMessage",
  async (message, { getState }) => {
    const state = getState().complaint;
    const data = await sendChat({
      message,
      currentComplaint: state.complaint,
      complaintId: state.complaintId,
    });
    return { data, previousComplaint: state.complaint };
  }
);

export const uploadComplaintDocument = createAsyncThunk(
  "complaint/uploadDocument",
  async (file, { getState }) => {
    const state = getState().complaint;
    const data = await extractDocument(file);
    return { data, previousComplaint: state.complaint };
  }
);

export const commitToLedger = createAsyncThunk(
  "complaint/commitToLedger",
  async (_, { getState }) => {
    const state = getState().complaint;
    const data = await commitComplaint({
      complaintId: state.complaintId,
      complaint: state.complaint,
      riskAssessment: state.riskAssessment,
      completeness: state.completeness,
      duplicateCheck: state.duplicateCheck,
    });
    return data;
  }
);

const complaintSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    clearHighlights(state) {
      state.highlightedFields = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.messages.push({ role: "user", text: action.meta.arg });
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        applyResponse(state, action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
        state.messages.push({
          role: "assistant",
          text: "Sorry, I couldn't reach the AI backend. Please check the API is running and try again.",
          isError: true,
        });
      })
      .addCase(uploadComplaintDocument.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.messages.push({
          role: "user",
          text: `📎 Uploaded document: ${action.meta.arg?.name || "complaint file"}`,
        });
      })
      .addCase(uploadComplaintDocument.fulfilled, (state, action) => {
        applyResponse(state, action.payload);
      })
      .addCase(uploadComplaintDocument.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
        state.messages.push({
          role: "assistant",
          text: "Sorry, I couldn't extract that document. Please check the API is running and try again.",
          isError: true,
        });
      })
      .addCase(commitToLedger.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(commitToLedger.fulfilled, (state, action) => {
        state.status = "idle";
        state.isCommitted = true;
        state.complaintId = action.payload.complaint_id;
        state.messages.push({
          role: "assistant",
          text: `✅ Committed to QMS Ledger as ${action.payload.complaint_id}.`,
        });
      })
      .addCase(commitToLedger.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
        state.messages.push({
          role: "assistant",
          text: "Sorry, I couldn't commit this complaint to the ledger. Please check the API is running and try again.",
          isError: true,
        });
      });
  },
});

function applyResponse(state, { data, previousComplaint }) {
  state.status = "idle";
  state.complaint = { ...emptyComplaint, ...data.complaint };
  state.riskAssessment = data.risk_assessment;
  state.completeness = data.completeness;
  state.duplicateCheck = data.duplicate_check;
  state.highlightedFields = diffChangedFields(previousComplaint, state.complaint);
  state.isCommitted = false; // any new AI turn re-opens the draft for review
  state.messages.push({ role: "assistant", text: data.reply });
}

export const { clearHighlights } = complaintSlice.actions;
export default complaintSlice.reducer;
