import React from "react";
import { useSelector } from "react-redux";
import { FORM_SECTIONS } from "../fieldConfig";

export default function ComplaintForm() {
  const complaint = useSelector((s) => s.complaint.complaint);
  const highlighted = useSelector((s) => s.complaint.highlightedFields);

  return (
    <div style={styles.wrap}>
      <div style={styles.titleRow}>
        <h1 style={styles.title}>Log Customer Complaint</h1>
        <p style={styles.subtitle}>
          Filled automatically by AIVOA Co-pilot &mdash; describe the complaint in the chat panel.
        </p>
      </div>

      {FORM_SECTIONS.map((section) => (
        <div key={section.title} style={styles.section}>
          <h2 style={styles.sectionTitle}>{section.title}</h2>
          <div style={styles.grid}>
            {section.fields.map((field) => (
              <FormField
                key={field.key}
                label={field.label}
                value={complaint?.[field.key]}
                multiline={field.multiline}
                highlighted={highlighted.includes(field.key)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormField({ label, value, multiline, highlighted }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <label style={{ ...styles.field, ...(multiline ? { gridColumn: "1 / -1" } : {}) }}>
      <span style={styles.label}>{label}</span>
      <Tag
        readOnly
        value={value || ""}
        placeholder="—"
        rows={multiline ? 3 : undefined}
        className="tabular"
        style={{
          ...styles.input,
          ...(multiline ? styles.textarea : {}),
          ...(highlighted ? styles.inputHighlighted : {}),
        }}
      />
    </label>
  );
}

const styles = {
  wrap: {
    padding: "24px 28px 60px",
    maxWidth: 720,
  },
  titleRow: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "1px solid var(--hairline)",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: "var(--ink-900)",
  },
  subtitle: {
    fontSize: 12.5,
    color: "var(--ink-500)",
    margin: "4px 0 0",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--teal-700)",
    margin: "0 0 10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 11.5,
    color: "var(--ink-500)",
    fontWeight: 600,
  },
  input: {
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius)",
    padding: "8px 10px",
    fontSize: 13.5,
    color: "var(--ink-900)",
    background: "var(--slate-50)",
    transition: "background-color 700ms ease, border-color 700ms ease",
  },
  textarea: {
    resize: "none",
    fontFamily: "var(--font)",
  },
  inputHighlighted: {
    background: "var(--teal-050)",
    borderColor: "var(--teal-600)",
  },
};
