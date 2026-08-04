import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signupUser } from "../services/api";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .auth-root {
    min-height: 100vh;
    background: #020617;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .auth-bg::before {
    content: '';
    position: fixed;
    top: -30%; right: -20%;
    width: 70%; height: 70%;
    background: radial-gradient(ellipse, rgba(34,211,238,0.12) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  .auth-bg::after {
    content: '';
    position: fixed;
    bottom: -20%; left: -10%;
    width: 60%; height: 60%;
    background: radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  .auth-card {
    position: relative; z-index: 1;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 24px;
    padding: 44px 40px;
    width: 100%; max-width: 440px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.5);
    animation: slideUp 0.4s ease forwards;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .auth-logo {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 32px; text-decoration: none;
  }
  .auth-logo-icon {
    width: 34px; height: 34px;
    background: linear-gradient(135deg, #6366f1, #22d3ee);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 14px; color: white;
  }
  .auth-logo-text {
    font-size: 16px; font-weight: 800;
    background: linear-gradient(135deg, #6366f1, #22d3ee);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .auth-title {
    font-size: 26px; font-weight: 900; color: #f1f5f9;
    margin-bottom: 8px; letter-spacing: -0.5px;
  }
  .auth-subtitle { font-size: 14px; color: #64748b; margin-bottom: 32px; line-height: 1.5; }
  .auth-label {
    display: block;
    font-size: 12px; font-weight: 600; color: #94a3b8;
    margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em;
  }
  .auth-input {
    width: 100%;
    background: #020617;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 13px 16px;
    font-size: 14px;
    color: #f1f5f9;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    margin-bottom: 20px;
  }
  .auth-input:focus {
    border-color: #22d3ee;
    box-shadow: 0 0 0 3px rgba(34,211,238,0.12);
  }
  .auth-input.error-border { border-color: #ef4444 !important; }
  .auth-input::placeholder { color: #475569; }
  .auth-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 10px;
    padding: 12px 16px;
    color: #fca5a5;
    font-size: 13px;
    margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }
  .auth-success {
    background: rgba(34,197,94,0.1);
    border: 1px solid rgba(34,197,94,0.3);
    border-radius: 10px;
    padding: 12px 16px;
    color: #86efac;
    font-size: 13px;
    margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }
  .pw-hint {
    font-size: 11px; color: #475569;
    margin-top: -14px; margin-bottom: 20px;
    padding-left: 4px;
  }
  .pw-strength {
    display: flex; gap: 4px; margin-top: -14px; margin-bottom: 20px;
  }
  .pw-bar {
    height: 3px; flex: 1; border-radius: 4px;
    transition: background 0.3s;
  }
  .btn-auth {
    width: 100%;
    background: linear-gradient(135deg, #22d3ee, #06b6d4);
    border: none; color: #020617;
    padding: 14px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 15px; font-weight: 800;
    font-family: inherit;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(34,211,238,0.3);
    margin-bottom: 14px;
  }
  .btn-auth:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(34,211,238,0.45);
  }
  .btn-auth:disabled { opacity: 0.65; cursor: not-allowed; }
  .btn-guest {
    width: 100%;
    background: transparent;
    border: 1px solid #334155;
    color: #94a3b8;
    padding: 13px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px; font-weight: 600;
    font-family: inherit;
    transition: all 0.2s;
    margin-bottom: 28px;
  }
  .btn-guest:hover {
    border-color: #475569;
    background: rgba(255,255,255,0.03);
    color: #cbd5e1;
  }
  .auth-divider {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 20px;
    color: #334155; font-size: 12px;
  }
  .auth-divider::before, .auth-divider::after {
    content: ''; flex: 1;
    height: 1px; background: #1e293b;
  }
  .auth-footer {
    text-align: center; font-size: 13px;
    color: #64748b; line-height: 1.6;
  }
  .auth-footer a {
    color: #22d3ee; text-decoration: none; font-weight: 600;
    transition: color 0.2s;
  }
  .auth-footer a:hover { color: #67e8f9; }
  .spinner-sm {
    width: 16px; height: 16px;
    border: 2px solid rgba(2,6,23,0.3);
    border-top: 2px solid #020617;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const getPasswordStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const STRENGTH_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#22d3ee"];
const STRENGTH_LABELS = ["Too short", "Weak", "Good", "Strong"];

export default function SignupPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    document.title = "Sign Up — CodeReview AI";
    if (isAuthenticated) navigate("/editor", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const data = await signupUser({ name: name.trim(), email: email.trim(), password });
      setSuccess("Account created! Redirecting to editor…");
      login(data.token, data.user);
      setTimeout(() => navigate("/editor", { replace: true }), 800);
    } catch (err) {
      const msg = err?.response?.data?.error || "Signup failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root auth-bg">
      <style>{styles}</style>
      <div className="auth-card">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon">&lt;/&gt;</div>
          <span className="auth-logo-text">CodeReview AI</span>
        </Link>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join for free and get unlimited code reviews &amp; runs.</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="auth-success" role="status">
              <span>✅</span> {success}
            </div>
          )}

          <label className="auth-label" htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            type="text"
            className="auth-input"
            placeholder="Alex Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            autoFocus
          />

          <label className="auth-label" htmlFor="signup-email">Email Address</label>
          <input
            id="signup-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="auth-label" htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            className={`auth-input${password && password.length < 8 ? " error-border" : ""}`}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {/* Password strength bars */}
          {password && (
            <>
              <div className="pw-strength">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="pw-bar"
                    style={{
                      background: i < strength ? STRENGTH_COLORS[strength - 1] : "#1e293b",
                    }}
                  />
                ))}
              </div>
              <div className="pw-hint">
                {strength > 0 ? STRENGTH_LABELS[strength - 1] : ""}
                {strength < 4 && " — add uppercase, numbers, or symbols to strengthen."}
              </div>
            </>
          )}

          <button
            id="signup-submit-btn"
            type="submit"
            className="btn-auth"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner-sm" /> Creating account…</>
            ) : (
              "🚀 Create Free Account"
            )}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button
          id="signup-guest-btn"
          className="btn-guest"
          onClick={() => navigate("/editor")}
        >
          👤 Continue as Guest (3 free reviews/day)
        </button>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
