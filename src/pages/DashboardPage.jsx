import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #010409; overflow-x: hidden; }

  .dash {
    min-height: 100vh;
    background: #010409;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Navbar */
  .dash-nav {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 40px;
    background: rgba(1,4,9,0.9);
    border-bottom: 1px solid rgba(99,102,241,0.12);
    position: sticky; top: 0; z-index: 100;
  }
  .dash-nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .dash-nav-logo-icon {
    width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #22d3ee);
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 900; color: white;
  }
  .dash-nav-logo-text {
    font-size: 15px; font-weight: 800;
    background: linear-gradient(135deg, #a5b4fc, #67e8f9);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .dash-nav-right { display: flex; gap: 12px; align-items: center; }
  .dash-btn {
    background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3);
    color: #a5b4fc; padding: 8px 16px; border-radius: 8px; cursor: pointer;
    font-size: 13px; font-weight: 600; font-family: inherit; transition: all 0.2s;
  }
  .dash-btn:hover { background: rgba(99,102,241,0.2); }
  .dash-btn-primary {
    background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; border: none;
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }
  .dash-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99,102,241,0.4); }

  /* Main Container */
  .dash-container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
  .dash-header { margin-bottom: 40px; }
  .dash-title { font-size: 32px; font-weight: 900; color: #f1f5f9; letter-spacing: -0.5px; margin-bottom: 8px; }
  .dash-sub { color: #64748b; font-size: 14px; }

  /* Stats Grid */
  .dash-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 40px; }
  .stat-card {
    background: linear-gradient(145deg, #0d1117, #0f172a);
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: 16px; padding: 24px;
  }
  .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .stat-val { font-size: 36px; font-weight: 800; color: #f1f5f9; }
  .stat-val.grad { background: linear-gradient(135deg, #818cf8, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

  /* History Feed */
  .history-section-title { font-size: 18px; font-weight: 800; color: #e2e8f0; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .history-card {
    background: #0d1117; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; margin-bottom: 16px; overflow: hidden;
  }
  .hc-header {
    background: #161b22; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .hc-type {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
    border-radius: 6px; padding: 2px 8px; font-size: 11px; color: #a5b4fc;
    text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;
  }
  .hc-type.run { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); color: #4ade80; }
  .hc-time { font-size: 12px; color: #64748b; }
  
  .hc-body { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
  .hc-code {
    background: #010409; border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px; padding: 12px; font-size: 13px; color: #a5b4fc;
    overflow-x: auto; max-height: 200px;
  }
  .hc-result {
    background: #0f172a; border: 1px solid rgba(99,102,241,0.15);
    border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #e2e8f0;
    max-height: 400px; overflow-y: auto;
  }

  .markdown-body pre { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; border: 1px solid rgba(255,255,255,0.05); }
  .markdown-body code { font-family: inherit; font-size: 12px; background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px; }
  .markdown-body pre code { background: transparent; padding: 0; }
  .markdown-body p { margin-bottom: 10px; }
  .markdown-body p:last-child { margin-bottom: 0; }
  .markdown-body h1, .markdown-body h2, .markdown-body h3 { font-size: 14px; font-weight: 800; margin-top: 16px; margin-bottom: 8px; color: #a5b4fc; }
  .markdown-body h1:first-child, .markdown-body h2:first-child, .markdown-body h3:first-child { margin-top: 0; }

  .empty-state {
    text-align: center; padding: 60px 20px;
    background: #0d1117; border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;
    color: #64748b;
  }
`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        const data = await getHistory();
        setHistory(data.history || []);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user, navigate]);

  const totalRuns = history.filter(h => h.type === "run").length;
  const totalReviews = history.filter(h => h.type === "review").length;

  return (
    <div className="dash">
      <style>{S}</style>
      
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="dash-nav">
        <div className="dash-nav-logo" onClick={() => navigate("/")}>
          <div className="dash-nav-logo-icon">&lt;/&gt;</div>
          <span className="dash-nav-logo-text">CodeReview AI</span>
        </div>
        <div className="dash-nav-right">
          <button className="dash-btn" onClick={() => navigate("/editor")}>⚡ Open Editor</button>
          <button className="dash-btn" onClick={() => { logout(); navigate("/"); }}>Logout</button>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="dash-container">
        <div className="dash-header">
          <h1 className="dash-title">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="dash-sub">Here is your coding activity and AI review history.</p>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-label">Total AI Reviews</div>
            <div className="stat-val grad">{totalReviews}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Executions</div>
            <div className="stat-val grad">{totalRuns}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Plan</div>
            <div className="stat-val" style={{ fontSize: "24px", marginTop: "8px", color: "#4ade80" }}>Pro Member</div>
          </div>
        </div>

        {/* Feed */}
        <h2 className="history-section-title">⏱ Recent Activity</h2>
        {loading ? (
          <div className="empty-state">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📂</div>
            <div>No history yet. Start coding in the editor to see your logs here!</div>
          </div>
        ) : (
          history.map((h) => (
            <div className="history-card" key={h.id}>
              <div className="hc-header">
                <span className={`hc-type ${h.type}`}>
                  {h.type === "review" ? "🧠 AI Review" : "⚡ Execution"} · {h.language}
                </span>
                <span className="hc-time">{new Date(h.timestamp).toLocaleString()}</span>
              </div>
              <div className="hc-body">
                <pre className="hc-code"><code>{h.code}</code></pre>
                <div className="hc-result">
                  {h.type === "review" ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{h.result}</ReactMarkdown>
                    </div>
                  ) : (
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                      {h.result}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
