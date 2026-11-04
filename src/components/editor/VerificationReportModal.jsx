import { CheckCircle2, AlertTriangle, ShieldCheck, X, Sparkles, ArrowRight } from "lucide-react";

export default function VerificationReportModal({ report, onClose, t }) {
  if (!report) return null;

  const {
    verified,
    verificationMethod,
    scoreBefore,
    scoreAfter,
    scoreImprovement,
    findingsFixed = [],
    findingsApplied = [],
    findingsStillPresent = [],
    testsPassed,
    testsFailed,
    totalTestsExecuted,
    behaviorChanges = [],
    verificationConfidence,
  } = report;

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
          maxWidth: "760px",
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
            padding: "20px 24px",
            borderBottom: `1px solid ${t.border}`,
            background: t.card,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: verified ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: verified ? "#22c55e" : "#f59e0b",
              }}
            >
              {verified ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: t.text }}>
                {verified ? "Patch Successfully Verified" : "Verification Incomplete / Warnings"}
              </h3>
              <div style={{ fontSize: "12px", color: t.muted, marginTop: "2px" }}>
                Grounding: {verificationMethod === "dynamic_execution_assertion" ? "Dynamic Judge0 Test Execution" : "No executed verification evidence"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: t.muted, cursor: "pointer" }}
            aria-label="Close report"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Key Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            {/* Score Delta */}
            <div style={{ background: t.card, padding: "14px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: "11px", color: t.muted, textTransform: "uppercase", fontWeight: "700" }}>
                Review Score
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ fontSize: "20px", fontWeight: "800", color: t.muted }}>{scoreBefore}</span>
                <ArrowRight size={16} color="#6366f1" />
                <span style={{ fontSize: "24px", fontWeight: "900", color: "#22c55e" }}>{scoreAfter}</span>
                {scoreImprovement > 0 && (
                  <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: "11px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" }}>
                    +{scoreImprovement}
                  </span>
                )}
              </div>
            </div>

            {/* Test Case Results */}
            <div style={{ background: t.card, padding: "14px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: "11px", color: t.muted, textTransform: "uppercase", fontWeight: "700" }}>
                Regression Tests
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px", color: testsFailed === 0 ? "#22c55e" : "#ef4444" }}>
                {testsPassed} / {totalTestsExecuted} Passed
              </div>
            </div>

            {/* Verification Confidence */}
            <div style={{ background: t.card, padding: "14px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: "11px", color: t.muted, textTransform: "uppercase", fontWeight: "700" }}>
                Verification Confidence
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px", color: "#818cf8" }}>
                {Math.round(verificationConfidence * 100)}%
              </div>
            </div>
          </div>

          {/* Behavior Changes */}
          {behaviorChanges.length > 0 && (
            <div style={{ background: t.card, padding: "16px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, marginBottom: "8px" }}>
                ⚡ Observed Runtime Behavior Changes
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: t.muted, lineHeight: "1.6" }}>
                {behaviorChanges.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Fixed Findings */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#22c55e", marginBottom: "8px" }}>
              ✓ Verified Resolved Issues ({findingsFixed.length})
            </div>
            {findingsFixed.length === 0 ? (
              <div style={{ fontSize: "13px", color: t.muted, fontStyle: "italic" }}>No findings marked as resolved.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {findingsFixed.map((f) => (
                  <div key={f.id} style={{ background: t.card, padding: "10px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                    <span>{f.title}</span>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: t.muted }}>{f.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {findingsApplied.length > 0 && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#818cf8", marginBottom: "8px" }}>
                Applied Suggestions ({findingsApplied.length})
              </div>
              <div style={{ fontSize: "13px", color: t.muted }}>
                These changes are recorded as applied. Run approved regression tests before treating them as resolved.
              </div>
            </div>
          )}

          {/* Remaining Findings */}
          {findingsStillPresent.length > 0 && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#f59e0b", marginBottom: "8px" }}>
                ⚠️ Remaining / Unpatched Issues ({findingsStillPresent.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {findingsStillPresent.map((f) => (
                  <div key={f.id} style={{ background: t.card, padding: "10px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                    <span>{f.title}</span>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: t.muted }}>{f.severity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${t.border}`, background: t.card, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              border: "none",
              color: "white",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
