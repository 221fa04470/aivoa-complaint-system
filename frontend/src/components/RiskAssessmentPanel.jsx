import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { commitToLedger } from "../store/complaintSlice";

const SEVERITY_STYLE = {
  Critical: { bg: "var(--red-050)", fg: "var(--red-600)" },
  Major: { bg: "var(--amber-050)", fg: "var(--amber-600)" },
  Minor: { bg: "var(--green-050)", fg: "var(--green-600)" },
};

export default function RiskAssessmentPanel() {
  const dispatch = useDispatch();
  const risk = useSelector((s) => s.complaint.riskAssessment);
  const completeness = useSelector((s) => s.complaint.completeness);
  const duplicateCheck = useSelector((s) => s.complaint.duplicateCheck);
  const isCommitted = useSelector((s) => s.complaint.isCommitted);
  const status = useSelector((s) => s.complaint.status);

  const hasRisk = risk && Object.keys(risk).length > 0;
  const severityStyle = SEVERITY_STYLE[risk?.severity] || { bg: "var(--slate-100)", fg: "var(--ink-500)" };

  return (
    <div style={styles.outer}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <ShieldIcon />
          <h2 style={styles.title}>AI Copilot Risk Assessment</h2>
        </div>

        {!hasRisk ? (
          <p style={styles.empty}>Log a complaint to see the AI's risk classification here.</p>
        ) : (
          <>
            <div style={styles.grid}>
              <div style={styles.field}>
                <span style={styles.rowLabel}>Severity (Suggested)</span>
                <span
                  style={{ ...styles.severityValue, background: severityStyle.bg, color: severityStyle.fg }}
                  className="tabular"
                >
                  {risk.severity} {risk.risk_score ? `· ${risk.risk_score}/10` : ""}
                </span>
              </div>
              <div style={styles.field}>
                <span style={styles.rowLabel}>Suggested Next Action</span>
                <span style={styles.plainValue}>{risk.next_action || "—"}</span>
              </div>
            </div>

            <Row label="CAPA recommendation" value={risk.capa_recommendation} />
            <Row label="Root cause hypothesis" value={risk.root_cause_hypothesis} />
            {risk.summary && <Row label="Summary" value={risk.summary} />}
            {risk.reasoning && (
              <div style={styles.reasoning}>
                <span style={styles.reasoningLabel}>Why:</span> {risk.reasoning}
              </div>
            )}
          </>
        )}

        <div style={styles.metaRow}>
          <CompletenessMeter completeness={completeness} />
        </div>

        {duplicateCheck?.is_duplicate && (
          <div style={styles.duplicateBanner}>
            <strong>Possible duplicate.</strong>{" "}
            {duplicateCheck.matches.map((m) => m.reason).join(" ")}
          </div>
        )}
      </div>

      {hasRisk && (
        <button
          type="button"
          onClick={() => dispatch(commitToLedger())}
          disabled={isCommitted || status === "loading"}
          style={{
            ...styles.commitButton,
            ...(isCommitted || status === "loading" ? styles.commitButtonDisabled : {}),
          }}
        >
          {isCommitted ? "Committed to QMS Ledger ✓" : "Commit to QMS Ledger"}
        </button>
      )}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value}</span>
    </div>
  );
}

function CompletenessMeter({ completeness }) {
  const score = completeness?.score ?? 0;
  const complete = completeness?.status === "Complete";
  return (
    <div>
      <div style={styles.completenessHeader}>
        <span style={styles.rowLabel}>Form completeness</span>
        <span className="tabular" style={{ fontSize: 12, fontWeight: 700, color: complete ? "var(--green-600)" : "var(--ink-700)" }}>
          {score}%
        </span>
      </div>
      <div style={styles.meterTrack}>
        <div
          style={{
            ...styles.meterFill,
            width: `${score}%`,
            background: complete ? "var(--green-600)" : "var(--teal-600)",
          }}
        />
      </div>
      {completeness?.missing_fields?.length > 0 && (
        <div style={styles.missingText}>Missing: {completeness.missing_fields.join(", ")}</div>
      )}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal-600)" strokeWidth="2">
      <path
        d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles = {
  outer: {
    maxWidth: 720,
    margin: "0 28px 40px",
  },
  card: {
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius)",
    background: "var(--slate-50)",
    padding: "18px 20px",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 13.5,
    fontWeight: 700,
    margin: 0,
    color: "var(--ink-900)",
  },
  empty: {
    fontSize: 12.5,
    color: "var(--ink-500)",
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 16px",
    marginBottom: 10,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  severityValue: {
    display: "inline-block",
    width: "fit-content",
    fontSize: 13.5,
    fontWeight: 700,
    padding: "6px 10px",
    borderRadius: "var(--radius)",
  },
  plainValue: {
    fontSize: 13,
    color: "var(--ink-900)",
    background: "var(--white)",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius)",
    padding: "7px 10px",
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--ink-500)",
  },
  rowValue: {
    fontSize: 13,
    color: "var(--ink-900)",
    lineHeight: 1.4,
    background: "var(--white)",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius)",
    padding: "7px 10px",
  },
  reasoning: {
    fontSize: 12,
    color: "var(--ink-500)",
    fontStyle: "italic",
    lineHeight: 1.45,
    marginBottom: 12,
  },
  reasoningLabel: {
    fontWeight: 700,
    fontStyle: "normal",
  },
  metaRow: {
    marginTop: 6,
    paddingTop: 12,
    borderTop: "1px solid var(--hairline)",
  },
  completenessHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  meterTrack: {
    height: 5,
    borderRadius: 3,
    background: "var(--slate-100)",
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 400ms ease",
  },
  missingText: {
    fontSize: 11.5,
    color: "var(--ink-500)",
    marginTop: 5,
  },
  duplicateBanner: {
    marginTop: 12,
    padding: "9px 11px",
    borderRadius: "var(--radius)",
    background: "var(--amber-050)",
    color: "var(--amber-600)",
    fontSize: 12.5,
    lineHeight: 1.45,
  },
  commitButton: {
    marginTop: 16,
    width: "100%",
    padding: "12px 14px",
    background: "var(--ink-900)",
    color: "var(--white)",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 13.5,
    fontWeight: 700,
    letterSpacing: "0.01em",
  },
  commitButtonDisabled: {
    background: "var(--green-600)",
    cursor: "default",
    opacity: 0.9,
  },
};
