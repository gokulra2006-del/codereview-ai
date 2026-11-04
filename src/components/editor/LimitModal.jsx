import { Lock, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LimitModal({ limitType, onClose, t }) {
  const navigate = useNavigate();

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
          maxWidth: "460px",
          padding: "28px",
          boxShadow: t.shadow,
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "#ef4444",
          }}
        >
          <Lock size={26} />
        </div>

        <h3 style={{ fontSize: "20px", fontWeight: "800", color: t.text, marginBottom: "8px" }}>
          Daily Quota Exceeded
        </h3>

        <p style={{ fontSize: "14px", color: t.muted, lineHeight: "1.6", marginBottom: "24px" }}>
          You have reached your daily quota for {limitType === "review" ? "AI code reviews" : "code executions"}. Sign up for a free account to unlock higher limits, history tracking, and workspace sessions.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={() => {
              onClose();
              navigate("/signup");
            }}
            style={{
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              border: "none",
              color: "white",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
            }}
          >
            Create Free Account <ArrowRight size={16} />
          </button>

          <button
            onClick={() => {
              onClose();
              navigate("/login");
            }}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              color: t.text,
              borderRadius: "10px",
              padding: "10px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Already have an account? Log In
          </button>
        </div>
      </div>
    </div>
  );
}
