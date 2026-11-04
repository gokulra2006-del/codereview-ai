import { X, Sliders } from "lucide-react";

export default function SettingsPanel({
  fontSize,
  setFontSize,
  editorTheme,
  setEditorTheme,
  onClose,
  t,
}) {
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: t.text }}>
            <Sliders size={18} color="#6366f1" /> Editor Preferences
          </h3>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: t.muted, cursor: "pointer" }}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Font Size */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: t.text, marginBottom: "8px" }}>
              <span>Font Size</span>
              <span style={{ fontWeight: "700", color: "#818cf8" }}>{fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="22"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
            />
          </div>

          {/* Theme */}
          <div>
            <label style={{ display: "block", fontSize: "13px", color: t.text, marginBottom: "8px" }}>
              Editor Monaco Theme
            </label>
            <select
              value={editorTheme}
              onChange={(e) => setEditorTheme(e.target.value)}
              className="pro-select"
              style={{ width: "100%", background: t.card, color: t.text, border: `1px solid ${t.border}` }}
            >
              <option value="vs-dark">Visual Studio Dark</option>
              <option value="vs-light">Visual Studio Light</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 18px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
