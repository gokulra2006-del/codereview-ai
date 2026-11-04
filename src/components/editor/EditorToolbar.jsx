import {
  Play,
  Search,
  MessageSquare,
  Clock,
  Moon,
  Sun,
  Settings,
  Terminal,
  Loader2,
  Undo2,
  BookmarkCheck,
  CheckCircle2,
} from "lucide-react";

export default function EditorToolbar({
  language,
  setLanguage,
  onLanguageChange,
  onTemplateChange,
  onFormat,
  onReview,
  onRun,
  reviewLoading,
  runLoading,
  darkMode,
  setDarkMode,
  chatOpen,
  setChatOpen,
  testMode,
  setTestMode,
  setShowSettings,
  setShowTimerSetup,
  timerMode,
  interviewMode,
  quota,
  historyStackCount,
  onUndo,
  onSaveSession,
  saveLoading,
  t,
}) {
  return (
    <div
      className="pro-toolbar"
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
        marginBottom: "16px",
      }}
    >
      {/* Language Picker */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <select
          value={language}
          onChange={onLanguageChange}
          className="pro-select"
          style={{ background: t.card, color: t.text, border: `1px solid ${t.border}` }}
          aria-label="Select programming language"
        >
          <option value="cpp">C++ (GCC)</option>
          <option value="python">Python 3</option>
          <option value="java">Java 13</option>
          <option value="javascript">JavaScript (Node)</option>
        </select>

        {/* Boilerplate Templates */}
        <select
          onChange={onTemplateChange}
          defaultValue=""
          className="pro-select"
          style={{ background: t.card, color: t.muted, border: `1px solid ${t.border}` }}
          aria-label="Load code template"
        >
          <option value="" disabled>
            ⚡ Templates…
          </option>
          <option value="cpp">C++ Starter</option>
          <option value="python">Python Starter</option>
          <option value="java">Java Starter</option>
          <option value="javascript">JavaScript Starter</option>
        </select>
      </div>

      {/* Editor Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={onFormat}
          className="pro-btn"
          style={{ color: t.muted }}
          title="Format Code (Alt+Shift+F)"
        >
          Format
        </button>

        {/* Undo Fix Button */}
        {historyStackCount > 0 && (
          <button
            onClick={onUndo}
            className="pro-btn"
            style={{
              color: "#f59e0b",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
            title="Undo last applied fix"
          >
            <Undo2 size={14} /> Undo Fix ({historyStackCount})
          </button>
        )}

        {/* Save Session */}
        <button
          onClick={onSaveSession}
          disabled={saveLoading}
          className="pro-btn"
          style={{ color: "#818cf8" }}
          title="Save review workspace session"
        >
          {saveLoading ? <Loader2 size={14} className="spinner" /> : <BookmarkCheck size={14} />}
          Save Session
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* Toggles and Triggers */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {/* Test Cases Toggle */}
        <button
          onClick={() => setTestMode((prev) => !prev)}
          className="pro-btn"
          style={{
            background: testMode ? "rgba(99,102,241,0.15)" : "transparent",
            color: testMode ? "#818cf8" : t.muted,
            border: testMode ? "1px solid rgba(99,102,241,0.4)" : `1px solid ${t.border}`,
          }}
          title="Toggle Test Cases Panel"
        >
          <Terminal size={15} /> Tests
        </button>

        {/* Interview Timer */}
        <button
          onClick={() => setShowTimerSetup(true)}
          className="pro-btn"
          style={{
            background: timerMode ? "rgba(34,197,94,0.15)" : "transparent",
            color: timerMode ? "#22c55e" : t.muted,
            border: timerMode ? "1px solid rgba(34,197,94,0.4)" : `1px solid ${t.border}`,
          }}
          title="Start or configure interview timer"
        >
          <Clock size={15} /> {timerMode ? `Interview (${interviewMode})` : "Interview Mode"}
        </button>

        {/* Chat Toggle */}
        <button
          onClick={() => setChatOpen((prev) => !prev)}
          className="pro-btn"
          style={{
            background: chatOpen ? "rgba(99,102,241,0.15)" : "transparent",
            color: chatOpen ? "#818cf8" : t.muted,
            border: chatOpen ? "1px solid rgba(99,102,241,0.4)" : `1px solid ${t.border}`,
          }}
          title="Toggle AI Chat (Ctrl+Shift+C)"
        >
          <MessageSquare size={15} /> Chat
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings((prev) => !prev)}
          className="pro-btn"
          style={{ color: t.muted }}
          title="Editor Settings"
          aria-label="Editor settings"
        >
          <Settings size={15} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode((prev) => !prev)}
          className="pro-btn"
          style={{ color: t.muted }}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle dark/light theme"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Primary Run Code Button */}
        <button
          onClick={onRun}
          disabled={runLoading}
          className="pro-primary-btn"
          style={{
            background: t.btnRun,
            color: t.btnRunText,
          }}
          title="Execute code (Ctrl+Enter)"
        >
          {runLoading ? <Loader2 size={16} className="spinner" /> : <Play size={16} />}
          <span>Run</span>
          {quota && quota.runs.remaining !== "unlimited" && (
            <span style={{ fontSize: "11px", opacity: 0.8, marginLeft: "2px" }}>
              ({quota.runs.remaining})
            </span>
          )}
        </button>

        {/* Primary AI Review Button */}
        <button
          onClick={onReview}
          disabled={reviewLoading}
          className="pro-primary-btn"
          style={{
            background: t.btnReview,
            color: t.btnReviewText,
          }}
          title="Review code with Verified AI (Ctrl+Shift+R)"
        >
          {reviewLoading ? <Loader2 size={16} className="spinner" /> : <Search size={16} />}
          <span>AI Review</span>
          {quota && quota.reviews.remaining !== "unlimited" && (
            <span style={{ fontSize: "11px", opacity: 0.8, marginLeft: "2px" }}>
              ({quota.reviews.remaining})
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
