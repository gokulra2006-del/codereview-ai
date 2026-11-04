import { Clock, Pause, PlayCircle, XCircle, CheckCircle2, ShieldAlert, X } from "lucide-react";
import { INTERVIEW_MODES, TIMER_PRESETS } from "../../hooks/useInterviewTimer";

export default function InterviewTimer({
  timerMode,
  timerLeft,
  timerRunning,
  interviewMode,
  showTimerSetup,
  showCancelConfirm,
  activeModeConfig,
  setInterviewMode,
  setShowTimerSetup,
  setShowCancelConfirm,
  startTimer,
  togglePause,
  cancelTimer,
  formatTimer,
  t,
}) {
  if (showTimerSetup) {
    return (
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "14px",
          padding: "18px 24px",
          marginBottom: "16px",
          boxShadow: t.shadow,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} color="#6366f1" /> Configure Interview Session
          </h3>
          <button
            onClick={() => setShowTimerSetup(false)}
            style={{ background: "transparent", border: "none", color: t.muted, cursor: "pointer" }}
            aria-label="Close setup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "12px", color: t.muted, marginBottom: "8px", fontWeight: "600", textTransform: "uppercase" }}>
            Select Difficulty Mode
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            {INTERVIEW_MODES.map((mode) => {
              const selected = interviewMode === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => setInterviewMode(mode.id)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: `1px solid ${selected ? mode.color : t.border}`,
                    background: selected ? mode.bg : "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: mode.color, marginBottom: "4px" }}>
                    {mode.id === "low" && <CheckCircle2 size={16} />}
                    {mode.id === "med" && <ShieldAlert size={16} />}
                    {mode.id === "strict" && <XCircle size={16} />}
                    {mode.title}
                  </div>
                  <div style={{ fontSize: "11px", color: t.muted }}>{mode.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Presets */}
        <div>
          <div style={{ fontSize: "12px", color: t.muted, marginBottom: "8px", fontWeight: "600", textTransform: "uppercase" }}>
            Select Duration
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset.seconds}
                onClick={() => startTimer(preset.seconds, interviewMode)}
                style={{
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#818cf8",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!timerMode) return null;

  return (
    <div
      className="interview-bar"
      style={{
        background: activeModeConfig.bg,
        border: `1px solid ${activeModeConfig.border}`,
        borderRadius: "12px",
        padding: "10px 18px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            background: activeModeConfig.color,
            color: "#ffffff",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {activeModeConfig.title}
        </span>
        <div style={{ fontSize: "13px", color: t.text }}>
          {activeModeConfig.longDesc}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          className={timerLeft <= 300 ? "timer-warning" : ""}
          style={{
            fontFamily: "monospace",
            fontSize: "18px",
            fontWeight: "800",
            color: timerLeft <= 300 ? "#ef4444" : activeModeConfig.color,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Clock size={16} />
          {formatTimer(timerLeft)}
        </div>

        <button
          onClick={togglePause}
          style={{
            background: "transparent",
            border: `1px solid ${t.border}`,
            color: t.text,
            padding: "5px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
          }}
          aria-label={timerRunning ? "Pause timer" : "Resume timer"}
        >
          {timerRunning ? <Pause size={14} /> : <PlayCircle size={14} />}
          {timerRunning ? "Pause" : "Resume"}
        </button>

        {showCancelConfirm ? (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>Cancel?</span>
            <button
              onClick={cancelTimer}
              style={{
                background: "#ef4444",
                border: "none",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              style={{
                background: "transparent",
                border: `1px solid ${t.border}`,
                color: t.text,
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCancelConfirm(true)}
            style={{
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
              padding: "5px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            End
          </button>
        )}
      </div>
    </div>
  );
}
