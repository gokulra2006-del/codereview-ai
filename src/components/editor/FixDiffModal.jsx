import { DiffEditor } from "@monaco-editor/react";
import { X, Check, AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";

export default function FixDiffModal({
  issue,
  originalCode,
  proposedCode,
  conflictWarning,
  language,
  editorTheme,
  onApply,
  onReject,
  onClose,
  t,
}) {
  if (!issue) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="limit-modal"
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "16px",
          width: "100%",
          maxWidth: "960px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${t.border}`,
            background: t.card,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span
                style={{
                  background: "rgba(99,102,241,0.15)",
                  color: "#818cf8",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                }}
              >
                Fix Preview
              </span>
              <span style={{ fontSize: "12px", color: t.muted, fontFamily: "monospace" }}>
                Targeting Lines {issue.startLine}–{issue.endLine}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: t.text }}>
              {issue.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: t.muted,
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
            }}
            aria-label="Close diff preview"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conflict Warning Banner */}
        {conflictWarning && (
          <div
            style={{
              background: "rgba(239,68,68,0.12)",
              borderBottom: "1px solid rgba(239,68,68,0.3)",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#ef4444",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            <AlertTriangle size={16} />
            <span>Conflict Detected: {conflictWarning}</span>
          </div>
        )}

        {/* Diff Description & Explanation */}
        <div style={{ padding: "12px 24px", background: t.pre, borderBottom: `1px solid ${t.border}`, fontSize: "13px", color: t.muted }}>
          <strong style={{ color: t.text }}>Explanation: </strong>
          {issue.explanation || issue.description}
        </div>

        {/* Monaco Diff Viewer */}
        <div style={{ flex: 1, minHeight: "360px", background: "#010409" }}>
          <DiffEditor
            original={originalCode}
            modified={proposedCode}
            language={language}
            theme={editorTheme}
            height="380px"
            options={{
              readOnly: true,
              renderSideBySide: true,
              automaticLayout: true,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${t.border}`,
            background: t.card,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => onReject(issue)}
            style={{
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
              borderRadius: "8px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <X size={15} /> Reject Fix
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: `1px solid ${t.border}`,
                color: t.text,
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              onClick={() => onApply(issue)}
              disabled={!!conflictWarning}
              style={{
                background: conflictWarning ? "#64748b" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                border: "none",
                color: "white",
                borderRadius: "8px",
                padding: "8px 22px",
                fontSize: "13.5px",
                fontWeight: "700",
                cursor: conflictWarning ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                opacity: conflictWarning ? 0.6 : 1,
              }}
            >
              <Check size={16} /> Apply Individual Fix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
