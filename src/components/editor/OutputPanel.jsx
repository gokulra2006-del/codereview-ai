import { Copy, Terminal, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function OutputPanel({
  output,
  stats,
  stdin,
  setStdin,
  loading,
  t,
}) {
  const [copied, setCopied] = useState(false);
  const [showStdin, setShowStdin] = useState(false);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Output copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: t.surface,
        borderRadius: "14px",
        padding: "18px 20px",
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: t.text }}>
          <Terminal size={16} /> Program Execution Output
        </h3>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setShowStdin((prev) => !prev)}
            style={{
              background: showStdin ? "rgba(99,102,241,0.15)" : "transparent",
              color: showStdin ? "#818cf8" : t.muted,
              border: `1px solid ${t.border}`,
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {showStdin ? "Hide Stdin" : "Input (stdin)"}
          </button>

          <button
            onClick={handleCopy}
            disabled={!output}
            style={{
              background: "transparent",
              color: t.muted,
              border: `1px solid ${t.border}`,
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "12px",
              cursor: output ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              opacity: output ? 1 : 0.6,
            }}
          >
            {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Optional Stdin Box */}
      {showStdin && (
        <div>
          <label style={{ fontSize: "12px", color: t.muted, display: "block", marginBottom: "4px" }}>
            Custom standard input (stdin):
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter standard input text here..."
            rows={2}
            style={{
              width: "100%",
              background: t.card,
              color: t.text,
              border: `1px solid ${t.border}`,
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
              fontFamily: "monospace",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Terminal View */}
      <div
        style={{
          background: t.pre,
          padding: "14px 16px",
          borderRadius: "10px",
          color: t.preText,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: "13px",
          lineHeight: "1.6",
          minHeight: "110px",
          maxHeight: "260px",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          border: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        {loading ? (
          <span style={{ color: t.muted }}>Running code on remote execution engine…</span>
        ) : (
          output || <span style={{ color: t.muted, fontStyle: "italic" }}>Press Run (Ctrl+Enter) to execute code. Output will display here.</span>
        )}
      </div>

      {/* Stats Bar */}
      {stats && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: t.muted }}>
          <span>
            Status: <strong style={{ color: stats.status === "Accepted" ? "#22c55e" : "#f59e0b" }}>{stats.status}</strong>
          </span>
          <span>Time: <strong style={{ color: t.text }}>{stats.time}</strong></span>
          <span>Memory: <strong style={{ color: t.text }}>{stats.memory}</strong></span>
        </div>
      )}
    </div>
  );
}
