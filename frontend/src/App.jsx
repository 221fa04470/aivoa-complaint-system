import React from "react";
import { useSelector } from "react-redux";
import ComplaintForm from "./components/ComplaintForm";
import CopilotChat from "./components/CopilotChat";
import RiskAssessmentPanel from "./components/RiskAssessmentPanel";

export default function App() {
  const complaintId = useSelector((s) => s.complaint.complaintId);

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.brandMark}>AIVOA</span>
          <span style={styles.brandDivider} />
          <span style={styles.brandSub}>Customer Complaint Management</span>
        </div>
        <div style={styles.complaintBadge}>
          {complaintId ? (
            <>
              <span style={{ color: "var(--ink-500)" }}>Complaint</span>{" "}
              <span className="tabular" style={{ fontWeight: 600 }}>
                {complaintId}
              </span>
            </>
          ) : (
            <span style={{ color: "var(--ink-500)" }}>No complaint logged yet</span>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.leftPane}>
          <ComplaintForm />
          <RiskAssessmentPanel />
        </section>
        <section style={styles.rightPane}>
          <div style={styles.chatArea}>
            <CopilotChat />
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  shell: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: 56,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    background: "var(--ink-900)",
    color: "var(--white)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  brandMark: {
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: "0.02em",
  },
  brandDivider: {
    width: 1,
    height: 16,
    background: "rgba(255,255,255,0.25)",
  },
  brandSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 500,
  },
  complaintBadge: {
    fontSize: 13,
    background: "rgba(255,255,255,0.08)",
    padding: "5px 10px",
    borderRadius: "var(--radius)",
  },
  main: {
    flex: 1,
    display: "flex",
    minHeight: 0,
  },
  leftPane: {
    width: "54%",
    minWidth: 420,
    borderRight: "1px solid var(--hairline)",
    overflowY: "auto",
    background: "var(--white)",
  },
  rightPane: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 380,
    background: "var(--slate-50)",
  },
  chatArea: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
};
