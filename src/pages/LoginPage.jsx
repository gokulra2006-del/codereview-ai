import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/api";

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
    top: -30%; left: -20%;
    width: 70%; height: 70%;
    background: radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .auth-bg::after {
    content: '';
    position: fixed;
    bottom: -20%; right: -10%;
    width: 60%; height: 60%;
    background: radial-gradient(ellipse, rgba(34,211,238,0.1) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
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
    margin-bottom: 32px; cursor: pointer;
    text-decoration: none;
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
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }
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
  .btn-auth {
    width: 100%;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none; color: white;
    padding: 14px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 15px; font-weight: 800;
    font-family: inherit;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(99,102,241,0.3);
    margin-bottom: 14px;
  }
  .btn-auth:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(99,102,241,0.45);
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
    color: #818cf8; text-decoration: none; font-weight: 600;
    transition: color 0.2s;
  }
  .auth-footer a:hover { color: #a5b4fc; }
  .spinner-sm {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Login — CodeReview AI";
    if (isAuthenticated) navigate("/editor", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser({ email: email.trim(), password });
      login(data.token, data.user);
      navigate("/editor", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || "Login failed. Please try again.";
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

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account for unlimited access.</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <label className="auth-label" htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />

          <label className="auth-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            id="login-submit-btn"
            type="submit"
            className="btn-auth"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner-sm" /> Signing in…</>
            ) : (
              "🔑 Sign In"
            )}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button
          id="login-guest-btn"
          className="btn-guest"
          onClick={() => navigate("/editor")}
        >
          👤 Continue as Guest (3 free reviews/day)
        </button>

        <div className="auth-footer">
          Don&apos;t have an account?{" "}
          <Link to="/signup">Create one free →</Link>
        </div>
      </div>
    </div>
  );
}
