import { Play, Plus, Trash2, CheckCircle2, XCircle, Clock, Sparkles, Loader2 } from "lucide-react";

export default function TestCasePanel({
  testCases,
  testLoading,
  onRunAllTests,
  onAddTestCase,
  onRemoveTestCase,
  onUpdateTestCase,
  t,
}) {
  const passedCount = testCases.filter((tc) => tc.status === "pass").length;
  const failedCount = testCases.filter((tc) => tc.status === "fail").length;

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
        gap: "14px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: t.text }}>
            Test Cases ({testCases.length})
          </h3>
          <div style={{ fontSize: "12px", color: t.muted, marginTop: "2px" }}>
            {passedCount > 0 && <span style={{ color: "#22c55e", marginRight: "8px" }}>✓ {passedCount} passed</span>}
            {failedCount > 0 && <span style={{ color: "#ef4444", marginRight: "8px" }}>✕ {failedCount} failed</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onAddTestCase}
            style={{
              background: "transparent",
              color: t.text,
              border: `1px solid ${t.border}`,
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={14} /> Add Case
          </button>

          <button
            onClick={onRunAllTests}
            disabled={testLoading}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: testLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              opacity: testLoading ? 0.7 : 1,
            }}
          >
            {testLoading ? <Loader2 size={14} className="spinner" /> : <Play size={14} />}
            Run All Tests
          </button>
        </div>
      </div>

      {/* Test Cases Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
        {testCases.map((tc, index) => {
          const isPass = tc.status === "pass";
          const isFail = tc.status === "fail";
          const isRunning = tc.status === "running";

          return (
            <div
              key={tc.id}
              style={{
                background: t.card,
                border: `1px solid ${isPass ? "rgba(34,197,94,0.4)" : isFail ? "rgba(239,68,68,0.4)" : t.border}`,
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* Case Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: "700", fontSize: "13px", color: t.text }}>
                    {tc.name || `Test Case #${index + 1}`}
                  </span>

                  {tc.isAiGenerated && (
                    <span
                      style={{
                        background: "rgba(99,102,241,0.15)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        color: "#818cf8",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Sparkles size={11} /> AI Generated
                    </span>
                  )}

                  {isPass && (
                    <span style={{ color: "#22c55e", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
                      <CheckCircle2 size={14} /> Passed
                    </span>
                  )}

                  {isFail && (
                    <span style={{ color: "#ef4444", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
                      <XCircle size={14} /> Failed
                    </span>
                  )}

                  {isRunning && (
                    <span style={{ color: "#f59e0b", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Loader2 size={13} className="spinner" /> Running…
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onRemoveTestCase(tc.id)}
                  style={{ background: "transparent", border: "none", color: t.muted, cursor: "pointer" }}
                  aria-label="Delete test case"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Input and Expected Output inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: t.muted, display: "block", marginBottom: "3px" }}>
                    Input (stdin):
                  </label>
                  <textarea
                    value={tc.input}
                    onChange={(e) => onUpdateTestCase(tc.id, "input", e.target.value)}
                    placeholder="Input values..."
                    rows={2}
                    style={{
                      width: "100%",
                      background: t.pre,
                      color: t.text,
                      border: `1px solid ${t.border}`,
                      borderRadius: "6px",
                      padding: "6px 8px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: t.muted, display: "block", marginBottom: "3px" }}>
                    Expected Output:
                  </label>
                  <textarea
                    value={tc.expectedOutput}
                    onChange={(e) => onUpdateTestCase(tc.id, "expectedOutput", e.target.value)}
                    placeholder="Expected stdout..."
                    rows={2}
                    style={{
                      width: "100%",
                      background: t.pre,
                      color: t.text,
                      border: `1px solid ${t.border}`,
                      borderRadius: "6px",
                      padding: "6px 8px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              {/* Actual output if executed */}
              {tc.actualOutput !== undefined && tc.actualOutput !== "" && (
                <div style={{ fontSize: "12px", background: "rgba(0,0,0,0.2)", padding: "6px 10px", borderRadius: "6px" }}>
                  <span style={{ color: t.muted }}>Actual Output: </span>
                  <code style={{ color: isPass ? "#22c55e" : "#ef4444" }}>{tc.actualOutput}</code>
                  {tc.executionTime && <span style={{ marginLeft: "12px", color: t.muted }}>({tc.executionTime})</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
