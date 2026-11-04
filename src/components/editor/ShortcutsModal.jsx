import { X, Command } from "lucide-react";

const SHORTCUTS = [
  { key: "Ctrl + Enter", desc: "Run code execution" },
  { key: "Ctrl + Shift + R", desc: "Run AI static code review" },
  { key: "Ctrl + Shift + C", desc: "Toggle AI Chat assistant" },
  { key: "Alt + Shift + F", desc: "Format code in editor" },
  { key: "Ctrl + Z", desc: "Undo last applied fix" },
  { key: "?", desc: "Show keyboard shortcuts" },
  { key: "Esc", desc: "Close any active modal" },
];

export default function ShortcutsModal({ onClose, t }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
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
          maxWidth: "460px",
          padding: "24px",
          boxShadow: t.shadow,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: t.text }}>
            <Command size={18} color="#6366f1" /> Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: t.muted, cursor: "pointer" }}
            aria-label="Close shortcuts"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: t.card,
                borderRadius: "8px",
                border: `1px solid ${t.border}`,
              }}
            >
              <span style={{ fontSize: "13px", color: t.text }}>{s.desc}</span>
              <kbd
                className="shortcut-badge"
                style={{
                  background: "rgba(99,102,241,0.12)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.3)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
