import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Eye,
  Check,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Loader2,
  FileCode,
} from "lucide-react";

const SEVERITY_COLORS = {
  critical: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", border: "rgba(239,68,68,0.3)" },
  high: { bg: "rgba(249,115,22,0.15)", text: "#f97316", border: "rgba(249,115,22,0.3)" },
  medium: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  low: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6", border: "rgba(59,130,246,0.3)" },
  info: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
};

const CATEGORY_ICONS = {
  bug: <AlertTriangle size={14} />,
  security: <ShieldAlert size={14} />,
  performance: <Zap size={14} />,
  maintainability: <FileCode size={14} />,
  style: <Sparkles size={14} />,
  accessibility: <Eye size={14} />,
};

export default function ReviewPanel({
  structuredReview,
  loading,
  selectedIssueId,
  setSelectedIssueId,
  onPreviewFix,
  acceptedFixes = [],
  rejectedFixes = [],
  onGenerateTests,
  onVerifyFixes,
  verificationLoading,
  t,
}) {
  if (loading) {
    return (
      <div
        style={{
          background: t.surface,
          borderRadius: "14px",
          padding: "32px 24px",
          border: `1px solid ${t.border}`,
          boxShadow: t.shadow,
          textAlign: "center",
        }}
      >
        <Loader2 size={32} className="spinner" style={{ color: "#6366f1", margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: "16px", color: t.text, marginBottom: "8px" }}>
          Generating Verified Review…
        </h3>
        <p style={{ fontSize: "13px", color: t.muted }}>
          Performing multi-dimensional AST & semantic inspection with JSON schema validation.
        </p>
      </div>
    );
  }

  if (!structuredReview) {
    return (
      <div
        style={{
          background: t.surface,
          borderRadius: "14px",
          padding: "40px 24px",
          border: `1px solid ${t.border}`,
          boxShadow: t.shadow,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
        <h3 style={{ fontSize: "16px", color: t.text, marginBottom: "8px" }}>
          No Active Code Review
        </h3>
        <p style={{ fontSize: "13px", color: t.muted, maxWidth: "420px", margin: "0 auto 16px" }}>
          Click <strong>AI Review</strong> above to run verified static code analysis, find bugs, optimize performance, and preview actionable fixes.
        </p>
      </div>
    );
  }

  const { summary, overallScore, issues = [], positiveObservations = [] } = structuredReview;

  return (
    <div
      style={{
        background: t.surface,
        borderRadius: "14px",
        padding: "20px",
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Review Header & Score Gauge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: `1px solid ${t.border}`,
          paddingBottom: "14px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", color: t.text }}>
            <Search size={18} color="#6366f1" /> Verified AI Review Findings
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: t.muted }}>
            {summary}
          </p>
        </div>

        {/* Score Badge */}
        <div
          style={{
            background: overallScore >= 80 ? "rgba(34,197,94,0.12)" : overallScore >= 60 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${overallScore >= 80 ? "rgba(34,197,94,0.3)" : overallScore >= 60 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: "10px",
            padding: "8px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "700", color: t.muted }}>
            Score
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "900",
              color: overallScore >= 80 ? "#22c55e" : overallScore >= 60 ? "#f59e0b" : "#ef4444",
            }}
          >
            {overallScore}<span style={{ fontSize: "13px", opacity: 0.7 }}>/100</span>
          </div>
        </div>
      </div>

      {/* Verification Actions Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          background: t.card,
          padding: "10px 14px",
          borderRadius: "10px",
          border: `1px solid ${t.border}`,
        }}
      >
        <div style={{ fontSize: "13px", color: t.muted }}>
          <strong style={{ color: t.text }}>{issues.length}</strong> findings identified ·{" "}
          <strong style={{ color: "#22c55e" }}>{acceptedFixes.length}</strong> fix(es) applied
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={onGenerateTests}
            style={{
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818cf8",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={14} /> Generate Regression Tests
          </button>

          <button
            onClick={onVerifyFixes}
            disabled={verificationLoading}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              color: "white",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: verificationLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              opacity: verificationLoading ? 0.7 : 1,
            }}
          >
            {verificationLoading ? <Loader2 size={14} className="spinner" /> : <CheckCircle2 size={14} />}
            Verify Patches
          </button>
        </div>
      </div>

      {/* Findings Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {issues.map((issue) => {
          const isSelected = selectedIssueId === issue.id;
          const isAccepted = acceptedFixes.includes(issue.id);
          const isRejected = rejectedFixes.includes(issue.id);
          const sevStyle = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium;

          return (
            <div
              key={issue.id}
              onClick={() => setSelectedIssueId(issue.id)}
              style={{
                background: isSelected ? t.card : t.pre,
                border: `1px solid ${isSelected ? "#6366f1" : t.border}`,
                borderRadius: "10px",
                padding: "14px 16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 4px 14px rgba(99,102,241,0.2)" : "none",
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: sevStyle.bg,
                      color: sevStyle.text,
                      border: `1px solid ${sevStyle.border}`,
                      borderRadius: "6px",
                      padding: "2px 7px",
                      fontSize: "11px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                    }}
                  >
                    {issue.severity}
                  </span>

                  <span
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${t.border}`,
                      borderRadius: "6px",
                      padding: "2px 7px",
                      fontSize: "11px",
                      color: t.muted,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      textTransform: "capitalize",
                    }}
                  >
                    {CATEGORY_ICONS[issue.category] || null}
                    {issue.category}
                  </span>

                  <span style={{ fontSize: "12px", color: t.muted, fontFamily: "monospace" }}>
                    Lines {issue.startLine}–{issue.endLine}
                  </span>

                  {isAccepted && (
                    <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                      ✓ Applied
                    </span>
                  )}

                  {isRejected && (
                    <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                      ✕ Rejected
                    </span>
                  )}
                </div>

                {/* Preview Fix Button */}
                {issue.suggestedReplacement && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewFix(issue);
                    }}
                    style={{
                      background: isAccepted ? "rgba(34,197,94,0.1)" : "rgba(99,102,241,0.15)",
                      border: `1px solid ${isAccepted ? "rgba(34,197,94,0.3)" : "rgba(99,102,241,0.3)"}`,
                      color: isAccepted ? "#22c55e" : "#818cf8",
                      borderRadius: "6px",
                      padding: "5px 10px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Eye size={13} /> {isAccepted ? "Re-preview Fix" : "Preview Fix"}
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <div style={{ fontWeight: "700", fontSize: "14px", color: t.text, marginBottom: "4px" }}>
                {issue.title}
              </div>
              <p style={{ margin: "0 0 8px", fontSize: "13px", color: t.muted, lineHeight: "1.5" }}>
                {issue.description}
              </p>

              {/* Impact / Explanation */}
              {issue.explanation && (
                <div style={{ fontSize: "12px", color: t.muted, background: "rgba(0,0,0,0.15)", padding: "8px 12px", borderRadius: "6px" }}>
                  <strong style={{ color: t.text }}>Impact:</strong> {issue.estimatedImpact || issue.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Positive Observations */}
      {positiveObservations.length > 0 && (
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: "14px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", marginBottom: "6px" }}>
            ✓ Positive Observations
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: t.muted }}>
            {positiveObservations.map((obs, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>{obs}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
