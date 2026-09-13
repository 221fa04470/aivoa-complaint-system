import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendMessage, uploadComplaintDocument } from "../store/complaintSlice";

export default function CopilotChat() {
  const dispatch = useDispatch();
  const messages = useSelector((s) => s.complaint.messages);
  const status = useSelector((s) => s.complaint.status);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function handleSend() {
    const text = draft.trim();
    if (!text || status === "loading") return;
    dispatch(sendMessage(text));
    setDraft("");
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch(uploadComplaintDocument(file));
    e.target.value = "";
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.dot} />
        <span style={styles.headerText}>AIVOA Co-pilot</span>
        <span style={styles.poweredBy}>Powered by LangGraph</span>
      </div>

      <div style={styles.thread} ref={scrollRef}>
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} isError={m.isError} />
        ))}
        {status === "loading" && <TypingBubble />}
      </div>

      <div style={styles.inputRow}>
        <button
          type="button"
          title="Upload complaint PDF or email"
          onClick={() => fileInputRef.current?.click()}
          style={styles.attachButton}
        >
          <PaperclipIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.eml,.txt"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Describe the complaint, or correct a field…"
          rows={1}
          style={styles.textarea}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || status === "loading"}
          style={{
            ...styles.sendButton,
            ...(!draft.trim() || status === "loading" ? styles.sendButtonDisabled : {}),
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ role, text, isError }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.bubbleUser : styles.bubbleAssistant),
          ...(isError ? styles.bubbleError : {}),
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div style={{ ...styles.bubble, ...styles.bubbleAssistant }}>
        <span style={styles.typingDots}>Thinking…</span>
      </div>
    </div>
  );
}

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.48"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 18px",
    borderBottom: "1px solid var(--hairline)",
  },
  poweredBy: {
    marginLeft: "auto",
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "var(--ink-500)",
    background: "var(--slate-100)",
    padding: "3px 8px",
    borderRadius: "var(--radius)",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--teal-600)",
  },
  headerText: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--ink-900)",
  },
  thread: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  bubble: {
    maxWidth: "84%",
    padding: "9px 12px",
    borderRadius: "var(--radius)",
    fontSize: 13.5,
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
  },
  bubbleAssistant: {
    background: "var(--white)",
    border: "1px solid var(--hairline)",
    color: "var(--ink-900)",
  },
  bubbleUser: {
    background: "var(--ink-900)",
    color: "var(--white)",
  },
  bubbleError: {
    background: "var(--red-050)",
    border: "1px solid var(--red-600)",
    color: "var(--red-600)",
  },
  typingDots: {
    color: "var(--ink-500)",
    fontStyle: "italic",
  },
  inputRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid var(--hairline)",
    background: "var(--white)",
  },
  attachButton: {
    border: "1px solid var(--hairline)",
    background: "var(--white)",
    borderRadius: "var(--radius)",
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--ink-500)",
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius)",
    padding: "8px 10px",
    fontSize: 13.5,
    maxHeight: 90,
    color: "var(--ink-900)",
  },
  sendButton: {
    background: "var(--teal-600)",
    color: "var(--white)",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "9px 16px",
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
  },
  sendButtonDisabled: {
    background: "var(--ink-300)",
    cursor: "not-allowed",
  },
};
