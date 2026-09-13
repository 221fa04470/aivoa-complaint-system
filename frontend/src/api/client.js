import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export function sendChat({ message, currentComplaint, complaintId }) {
  return api
    .post("/api/chat", {
      message,
      current_complaint: currentComplaint,
      complaint_id: complaintId,
    })
    .then((r) => r.data);
}

export function extractDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/api/extract-document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

export function commitComplaint({ complaintId, complaint, riskAssessment, completeness, duplicateCheck }) {
  return api
    .post("/api/complaints/commit", {
      complaint_id: complaintId,
      complaint,
      risk_assessment: riskAssessment,
      completeness,
      duplicate_check: duplicateCheck,
    })
    .then((r) => r.data);
}

export function fetchComplaints() {
  return api.get("/api/complaints").then((r) => r.data);
}
