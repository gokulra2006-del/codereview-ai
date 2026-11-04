import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, getSessions, deleteSession } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Trash2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Award,
  Zap,
  Code2,
} from "lucide-react";

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

  .dash-container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
  .dash-header { margin-bottom: 32px; }
  .dash-title { font-size: 32px; font-weight: 900; color: #f1f5f9; letter-spacing: -0.5px; margin-bottom: 8px; }
  .dash-sub { color: #64748b; font-size: 14px; }

  /* Stats Grid */
  .dash-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: linear-gradient(145deg, #0d1117, #0f172a);
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: 16px; padding: 20px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; font-weight: 700; }
  .stat-val { font-size: 30px; font-weight: 900; color: #f1f5f9; }
  .stat-val.grad { background: linear-gradient(135deg, #818cf8, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

  /* Filters Bar */
  .filter-bar {
    background: #0d1117; border: 1px solid rgba(99,102,241,0.15);
    border-radius: 12px; padding: 14px 20px; margin-bottom: 24px;
    display: flex; gap: 14px; align-items: center; flex-wrap: wrap;
  }
  .filter-select {
    background: #161b22; color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 6px 12px; font-family: inherit; font-size: 12px;
    outline: none; cursor: pointer;
  }

  /* Sessions List */
  .session-card {
    background: #0d1117; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; margin-bottom: 16px; overflow: hidden;
    transition: all 0.2s ease;
  }
  .session-card:hover {
    border-color: rgba(99,102,241,0.3);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .sc-header {
    background: #161b22; padding: 14px 20px; display: flex;
    justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .sc-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }

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
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterLang, setFilterLang] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("sessions"); // 'sessions' | 'history'

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [histData, sessData] = await Promise.all([
          getHistory().catch(() => ({ history: [] })),
          getSessions().catch(() => ({ sessions: [] })),
        ]);
        setHistory(histData?.history || []);
        setSessions(sessData?.sessions || []);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  // Aggregate Insights
  const stats = useMemo(() => {
    let totalScoreGain = 0;
    let scoreGainCount = 0;
    let totalTestsPassed = 0;
    const langScores = {};
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    const categoryCounts = {};

    sessions.forEach((s) => {
      const orig = s.originalScore || 0;
      const fin = s.finalScore || orig;
      if (fin > orig) {
        totalScoreGain += fin - orig;
        scoreGainCount++;
      }

      // Language gain
      if (!langScores[s.language]) langScores[s.language] = { gain: 0, count: 0 };
      langScores[s.language].gain += Math.max(0, fin - orig);
      langScores[s.language].count++;

      // Tests passed
      if (s.verificationResults?.testsPassed) {
        totalTestsPassed += s.verificationResults.testsPassed;
      }

      // Issues by severity and category
      const issues = s.structuredFindings?.issues || [];
      issues.forEach((iss) => {
        if (iss.severity && severityCounts[iss.severity] !== undefined) {
          severityCounts[iss.severity]++;
        }
        if (iss.category) {
          categoryCounts[iss.category] = (categoryCounts[iss.category] || 0) + 1;
        }
      });
    });

    let bestLang = "None yet";
    let maxGain = -1;
    for (const [lang, val] of Object.entries(langScores)) {
      if (val.gain > maxGain) {
        maxGain = val.gain;
        bestLang = lang.toUpperCase();
      }
    }

    return {
      totalSessions: sessions.length,
      avgScoreImprovement: scoreGainCount > 0 ? `+${Math.round(totalScoreGain / scoreGainCount)} pts` : "0 pts",
      totalTestsPassed,
      bestLanguage: bestLang,
      severityCounts,
      categoryCounts,
    };
  }, [sessions]);

  // Filtered Sessions List
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterLang !== "all" && s.language !== filterLang) return false;
      if (filterSeverity !== "all") {
        const hasSev = s.structuredFindings?.issues?.some((i) => i.severity === filterSeverity);
        if (!hasSev) return false;
      }
      if (filterCategory !== "all") {
        const hasCat = s.structuredFindings?.issues?.some((i) => i.category === filterCategory);
        if (!hasCat) return false;
      }
      return true;
    });
  }, [sessions, filterLang, filterSeverity, filterCategory]);

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Delete this review session?")) return;
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      toast.success("Session deleted");
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const handleReopenSession = (sessionId) => {
    navigate(`/editor?session=${sessionId}`);
  };

  return (
    <div className="dash">
      <style>{S}</style>
      <Toaster position="top-right" />

      {/* Navbar */}
      <nav className="dash-nav">
        <div className="dash-nav-logo" onClick={() => navigate("/")}>
          <div className="dash-nav-logo-icon">&lt;/&gt;</div>
          <span className="dash-nav-logo-text">CodeReview AI</span>
        </div>
        <div className="dash-nav-right">
          <button className="dash-btn dash-btn-primary" onClick={() => navigate("/editor")}>
            ⚡ Open Workspace
          </button>
          <button
            className="dash-btn"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="dash-container">
        <div className="dash-header">
          <h1 className="dash-title">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="dash-sub">
            Review sessions, score improvements, regression verifications, and coding insights.
          </p>
        </div>

        {/* Aggregated Stats Grid */}
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-label">Review Sessions</div>
            <div className="stat-val grad">{stats.totalSessions}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Score Improvement</div>
            <div className="stat-val" style={{ color: "#22c55e" }}>
              {stats.avgScoreImprovement}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Tests Passed</div>
            <div className="stat-val grad">{stats.totalTestsPassed}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Most Improved Lang</div>
            <div className="stat-val" style={{ fontSize: "24px", color: "#67e8f9" }}>
              {stats.bestLanguage}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Membership Tier</div>
            <div
              className="stat-val"
              style={{
                fontSize: "22px",
                color: user?.plan === "pro" ? "#4ade80" : "#a5b4fc",
                textTransform: "capitalize",
              }}
            >
              {user?.plan ? `${user.plan} Plan` : "Free Tier"}
            </div>
          </div>
        </div>

        {/* Issue Distribution Badges */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
            Findings by Severity:
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
              {stats.severityCounts.critical} Critical
            </span>
            <span style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
              {stats.severityCounts.high} High
            </span>
            <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
              {stats.severityCounts.medium} Medium
            </span>
            <span style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
              {stats.severityCounts.low} Low
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Sessions vs Legacy Executions) */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <button
            onClick={() => setActiveTab("sessions")}
            className="dash-btn"
            style={{
              background: activeTab === "sessions" ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.06)",
              color: activeTab === "sessions" ? "#818cf8" : "#94a3b8",
              borderColor: activeTab === "sessions" ? "#6366f1" : "rgba(99,102,241,0.2)",
            }}
          >
            📋 Review Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className="dash-btn"
            style={{
              background: activeTab === "history" ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.06)",
              color: activeTab === "history" ? "#818cf8" : "#94a3b8",
              borderColor: activeTab === "history" ? "#6366f1" : "rgba(99,102,241,0.2)",
            }}
          >
            ⚡ Execution Activity ({history.length})
          </button>
        </div>

        {/* Filters Bar for Sessions */}
        {activeTab === "sessions" && (
          <div className="filter-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
              <Filter size={14} /> Filter Sessions:
            </div>

            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Languages</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="bug">Bugs</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="maintainability">Maintainability</option>
            </select>
          </div>
        )}

        {/* Tab 1: Review Sessions List */}
        {activeTab === "sessions" && (
          <div>
            {loading ? (
              <div className="empty-state">Loading review sessions…</div>
            ) : filteredSessions.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  No Review Sessions Found
                </div>
                <p style={{ fontSize: "13px" }}>
                  Start coding in the editor and click "Save Session" to track your verified review milestones!
                </p>
              </div>
            ) : (
              filteredSessions.map((s) => {
                const issues = s.structuredFindings?.issues || [];
                const origScore = s.originalScore || 0;
                const finScore = s.finalScore || origScore;
                const fixedCount = s.acceptedFixes?.length || 0;

                return (
                  <div className="session-card" key={s.sessionId}>
                    <div className="sc-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            background: "rgba(99,102,241,0.15)",
                            color: "#818cf8",
                            border: "1px solid rgba(99,102,241,0.3)",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                          }}
                        >
                          {s.language}
                        </span>

                        {s.status === "verified" ? (
                          <span
                            style={{
                              background: "rgba(34,197,94,0.15)",
                              color: "#22c55e",
                              border: "1px solid rgba(34,197,94,0.3)",
                              borderRadius: "6px",
                              padding: "3px 8px",
                              fontSize: "11px",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <ShieldCheck size={13} /> Verified Patches
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Active Review</span>
                        )}

                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {new Date(s.updatedAt || s.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          onClick={() => handleReopenSession(s.sessionId)}
                          className="dash-btn dash-btn-primary"
                          style={{ padding: "6px 14px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                          <ExternalLink size={13} /> Reopen in Editor
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s.sessionId)}
                          style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "6px" }}
                          aria-label="Delete session"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="sc-body">
                      {/* Score Comparison */}
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                          Quality Score:{" "}
                          <strong style={{ color: "#f1f5f9" }}>{origScore}</strong> →{" "}
                          <strong style={{ color: finScore >= origScore ? "#22c55e" : "#ef4444" }}>{finScore}</strong>
                          {finScore > origScore && (
                            <span style={{ marginLeft: "6px", color: "#22c55e", fontWeight: "700" }}>
                              (+{finScore - origScore} pts)
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                          Fixed: <strong style={{ color: "#22c55e" }}>{fixedCount}</strong> / {issues.length} issues
                        </div>

                        {s.verificationResults?.testsPassed !== undefined && (
                          <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                            Regression Tests: <strong style={{ color: "#818cf8" }}>{s.verificationResults.testsPassed}</strong> passed
                          </div>
                        )}
                      </div>

                      {/* Summary text */}
                      {s.structuredFindings?.summary && (
                        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", lineHeight: "1.5" }}>
                          {s.structuredFindings.summary}
                        </p>
                      )}

                      {/* Recently Fixed Issues List */}
                      {s.acceptedFixes && s.acceptedFixes.length > 0 && (
                        <div>
                          <div style={{ fontSize: "12px", color: "#22c55e", fontWeight: "700", marginBottom: "6px" }}>
                            ✓ Applied Fixes:
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {s.acceptedFixes.map((fixId) => {
                              const found = issues.find((i) => i.id === fixId);
                              return (
                                <span
                                  key={fixId}
                                  style={{
                                    background: "rgba(34,197,94,0.1)",
                                    border: "1px solid rgba(34,197,94,0.3)",
                                    borderRadius: "6px",
                                    padding: "3px 8px",
                                    fontSize: "12px",
                                    color: "#22c55e",
                                  }}
                                >
                                  {found?.title || fixId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Raw Execution Logs */}
        {activeTab === "history" && (
          <div>
            {history.length === 0 ? (
              <div className="empty-state">No execution logs found.</div>
            ) : (
              history.map((h) => (
                <div className="session-card" key={h.id}>
                  <div className="sc-header">
                    <span
                      style={{
                        background: h.type === "run" ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.15)",
                        color: h.type === "run" ? "#4ade80" : "#a5b4fc",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      {h.type} · {h.language}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="sc-body">
                    <pre
                      style={{
                        background: "#010409",
                        padding: "10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#818cf8",
                        overflowX: "auto",
                        maxHeight: "150px",
                      }}
                    >
                      <code>{h.code}</code>
                    </pre>
                    <div style={{ fontSize: "13px", color: "#e2e8f0" }}>
                      {typeof h.result === "string" ? (
                        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
                          {h.result}
                        </pre>
                      ) : (
                        <div style={{ color: "#94a3b8" }}>
                          Review record with {h.result?.issues?.length || 0} finding(s).
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
