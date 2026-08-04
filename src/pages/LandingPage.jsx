import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

// ─── Particle canvas ────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2, alpha: Math.random(),
      twinkleSpeed: Math.random() * 0.018 + 0.004,
      twinkleDir: Math.random() > 0.5 ? 1 : -1,
    }));
    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 0.5,
      color: Math.random() > 0.5 ? "#6366f1" : "#22d3ee",
      alpha: Math.random() * 0.5 + 0.2, trail: [],
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.alpha += s.twinkleSpeed * s.twinkleDir;
        if (s.alpha >= 1) { s.alpha = 1; s.twinkleDir = -1; }
        if (s.alpha <= 0.05) { s.alpha = 0.05; s.twinkleDir = 1; }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`; ctx.fill();
      });
      particles.forEach(p => {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 10) p.trail.shift();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        p.trail.forEach((t, i) => {
          const a = (i / p.trail.length) * p.alpha * 0.4;
          ctx.beginPath(); ctx.arc(t.x, t.y, (i / p.trail.length) * p.r, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${Math.floor(a * 255).toString(16).padStart(2, "0")}`; ctx.fill();
        });
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, p.color + "cc"); g.addColorStop(1, p.color + "00");
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

// ─── Code examples per file tab ───────────────────────────────────────────────
const MOCK_FILES = {
  "main.js": {
    lang: "JavaScript",
    lines: [
      { indent: 0, tokens: [{ t: "function", c: "#c084fc" }, { t: " reviewCode", c: "#60a5fa" }, { t: "(", c: "#e2e8f0" }, { t: "code", c: "#f97316" }, { t: ") {", c: "#e2e8f0" }] },
      { indent: 1, tokens: [{ t: "const", c: "#c084fc" }, { t: " result = ", c: "#e2e8f0" }, { t: "await", c: "#c084fc" }, { t: " ai.", c: "#e2e8f0" }, { t: "analyze", c: "#60a5fa" }, { t: "(code);", c: "#e2e8f0" }] },
      { indent: 1, tokens: [{ t: "if", c: "#c084fc" }, { t: " (result.", c: "#e2e8f0" }, { t: "bugs", c: "#f97316" }, { t: ".length > ", c: "#e2e8f0" }, { t: "0", c: "#22d3ee" }, { t: ") {", c: "#e2e8f0" }] },
      { indent: 2, tokens: [{ t: "return", c: "#c084fc" }, { t: " { status: ", c: "#e2e8f0" }, { t: '"needs_fix"', c: "#86efac" }, { t: " };", c: "#e2e8f0" }] },
      { indent: 1, tokens: [{ t: "}", c: "#e2e8f0" }] },
      { indent: 1, tokens: [{ t: "return", c: "#c084fc" }, { t: " { status: ", c: "#e2e8f0" }, { t: '"clean"', c: "#86efac" }, { t: " };", c: "#e2e8f0" }] },
      { indent: 0, tokens: [{ t: "}", c: "#e2e8f0" }] },
    ],
    output: { tab: "I/O", lines: [{ t: "✓", c: "em-check", msg: "No critical bugs found" }, { t: "⚡", c: "em-warn", msg: "2 optimizations suggested" }, { t: "ℹ", c: "em-info", msg: "Code quality score: 94/100" }] },
    review: { tab: "AI Review", lines: [{ t: "🤖", c: "em-info", msg: "Function structure is clean" }, { t: "💡", c: "em-warn", msg: "Consider adding JSDoc comments" }, { t: "✓", c: "em-check", msg: "Async/await used correctly" }] },
    chat: { tab: "Chat", lines: [{ t: "💬", c: "em-info", msg: "Ask me about your code..." }, { t: "→", c: "em-check", msg: "Try: \"Explain line 2\"" }, { t: "→", c: "em-check", msg: "Try: \"Add error handling\"" }] },
  },
  "utils.py": {
    lang: "Python",
    lines: [
      { indent: 0, tokens: [{ t: "def", c: "#c084fc" }, { t: " analyze_code", c: "#60a5fa" }, { t: "(", c: "#e2e8f0" }, { t: "source", c: "#f97316" }, { t: "):", c: "#e2e8f0" }] },
      { indent: 1, tokens: [{ t: '"""', c: "#86efac" }, { t: "AI-powered analysis", c: "#86efac" }, { t: '"""', c: "#86efac" }] },
      { indent: 1, tokens: [{ t: "issues", c: "#60a5fa" }, { t: " = []", c: "#e2e8f0" }] },
      { indent: 1, tokens: [{ t: "for", c: "#c084fc" }, { t: " line ", c: "#e2e8f0" }, { t: "in", c: "#c084fc" }, { t: " source.split(", c: "#e2e8f0" }, { t: '"\\n"', c: "#86efac" }, { t: "):", c: "#e2e8f0" }] },
      { indent: 2, tokens: [{ t: "if", c: "#c084fc" }, { t: " len(line) > ", c: "#e2e8f0" }, { t: "120", c: "#22d3ee" }, { t: ":", c: "#e2e8f0" }] },
      { indent: 3, tokens: [{ t: "issues.append(", c: "#e2e8f0" }, { t: '"line too long"', c: "#86efac" }, { t: ")", c: "#e2e8f0" }] },
      { indent: 1, tokens: [{ t: "return", c: "#c084fc" }, { t: " issues", c: "#60a5fa" }] },
    ],
    output: { tab: "I/O", lines: [{ t: "✓", c: "em-check", msg: "Python syntax valid" }, { t: "⚡", c: "em-warn", msg: "1 style issue found" }, { t: "ℹ", c: "em-info", msg: "PEP8 compliance: 97%" }] },
    review: { tab: "AI Review", lines: [{ t: "🤖", c: "em-info", msg: "Docstring detected — good!" }, { t: "💡", c: "em-warn", msg: "Use re module for line checks" }, { t: "✓", c: "em-check", msg: "Loop logic is correct" }] },
    chat: { tab: "Chat", lines: [{ t: "💬", c: "em-info", msg: "Python helper ready" }, { t: "→", c: "em-check", msg: "Try: \"Optimize the loop\"" }, { t: "→", c: "em-check", msg: "Try: \"Add type hints\"" }] },
  },
};

// ─── Interactive Editor Mock ───────────────────────────────────────────────────
function EditorMock({ onRun }) {
  const [activeFile, setActiveFile] = useState("main.js");
  const [activeOutTab, setActiveOutTab] = useState("I/O");
  const [visibleLines, setVisibleLines] = useState(0);
  const [running, setRunning] = useState(false);

  const file = MOCK_FILES[activeFile];
  const outData = activeOutTab === "I/O" ? file.output : activeOutTab === "AI Review" ? file.review : file.chat;

  // Re-animate code when file changes
  useEffect(() => {
    setVisibleLines(0);
  }, [activeFile]);

  useEffect(() => {
    if (visibleLines >= file.lines.length) return;
    const t = setTimeout(() => setVisibleLines(v => v + 1), 110);
    return () => clearTimeout(t);
  }, [visibleLines, file.lines.length]);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setActiveOutTab("I/O"); }, 800);
    if (onRun) onRun();
  };

  return (
    <div className="editor-mock">
      <div className="em-titlebar">
        <div className="em-dots">
          <span className="em-dot em-dot-r" />
          <span className="em-dot em-dot-y" />
          <span className="em-dot em-dot-g" />
        </div>
        <div className="em-tabs">
          {Object.keys(MOCK_FILES).map(fname => (
            <div key={fname}
              className={`em-tab ${activeFile === fname ? "em-tab-active" : ""}`}
              onClick={() => setActiveFile(fname)}>
              {activeFile === fname && <span className="em-tab-icon">≡</span>}
              {fname}
            </div>
          ))}
          <div className="em-tab" onClick={onRun} title="Open real editor">+</div>
        </div>
        <div className="em-actions">
          <div className="em-lang-pill">{file.lang} ▾</div>
          <div className={`em-run-btn ${running ? "em-run-running" : ""}`} onClick={handleRun}>
            <span>{running ? "◌" : "▶"}</span>{running ? "Running..." : "Run"}
          </div>
        </div>
      </div>
      <div className="em-body">
        <div className="em-gutter">
          {file.lines.map((_, i) => (
            <div key={i} className="em-lnum" style={{ opacity: i < visibleLines ? 1 : 0 }}>{i + 1}</div>
          ))}
        </div>
        <div className="em-code">
          {file.lines.map((line, i) => (
            <div key={`${activeFile}-${i}`} className="em-line"
              style={{ opacity: i < visibleLines ? 1 : 0, transform: i < visibleLines ? "translateX(0)" : "translateX(-8px)", transition: "opacity 0.18s, transform 0.18s" }}>
              <span style={{ display: "inline-block", width: `${line.indent * 18}px` }} />
              {line.tokens.map((tok, j) => <span key={j} style={{ color: tok.c }}>{tok.t}</span>)}
            </div>
          ))}
          {visibleLines >= file.lines.length && (
            <div className="em-cursor-line"><span className="em-cursor" /></div>
          )}
        </div>
      </div>
      <div className="em-output">
        <div className="em-output-tabs">
          {["I/O", "AI Review", "Chat"].map(tab => (
            <span key={tab}
              className={`em-otab ${activeOutTab === tab ? "em-otab-active" : ""}`}
              onClick={() => setActiveOutTab(tab)}>
              {tab}
            </span>
          ))}
        </div>
        <div className="em-output-body">
          <div className="em-output-label">{outData.tab}</div>
          {outData.lines.map((l, i) => (
            <div key={i} className={`em-output-line ${l.c}`}>
              <span>{l.t}</span>{l.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast">{msg}</div>;
}

// ─── Language dropdown ─────────────────────────────────────────────────────────
const LANG_LIST = ["JavaScript", "Python", "Java", "C++", "TypeScript", "Go"];

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "🤖", title: "AI Code Review", desc: "State-of-the-art LLMs analyze your code instantly — bugs, anti-patterns, and optimizations detected in seconds.", tag: "AI", route: "/editor" },
  { icon: "⚡", title: "Zero-Gravity Execution", desc: "Run C++, Python, Java & JavaScript in the cloud at warp speed. No setup, no installs — just pure execution.", tag: "FAST", route: "/editor" },
  { icon: "🧪", title: "Multi-Test Engine", desc: "Launch all test cases simultaneously. Watch pass/fail results populate in real-time across parallel runs.", tag: "PARALLEL", route: "/editor" },
  { icon: "💬", title: "AI Chat Co-Pilot", desc: "Your personal coding co-pilot. Context-aware answers, explanations, and transformations for your exact code.", tag: "CHAT", route: "/editor" },
  { icon: "⏱", title: "Interview Simulator", desc: "Build pressure-resilience with a countdown timer. Simulate live coding interviews from 30 to 90 minutes.", tag: "PREP", route: "/editor" },
  { icon: "🌌", title: "Universal Languages", desc: "Seamlessly switch between languages. Each switch loads an optimized template so you hit the ground running.", tag: "MULTI", route: "/editor" },
];

const STEPS = [
  { num: "01", title: "Write Your Code", desc: "Start from a smart template or paste your own. Monaco editor with syntax highlighting and keyboard shortcuts." },
  { num: "02", title: "Launch & Review", desc: "Hit Run for instant execution or Review for a deep AI analysis. Output and review appear side-by-side." },
  { num: "03", title: "Iterate to Perfection", desc: "Chat with the AI co-pilot, fix edge cases, and optimize until your code is production-ready." },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #010409; overflow-x: hidden; }
  .land { min-height: 100vh; background: #010409; color: #e2e8f0; font-family: 'JetBrains Mono', 'Fira Code', monospace; position: relative; overflow-x: hidden; }

  .nebula-1 { position: fixed; top: -20%; left: -15%; width: 600px; height: 600px; background: radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%); border-radius: 50%; animation: nebulaFloat 14s ease-in-out infinite alternate; pointer-events: none; z-index: 0; }
  .nebula-2 { position: fixed; bottom: -15%; right: -10%; width: 700px; height: 500px; background: radial-gradient(ellipse, rgba(34,211,238,0.08) 0%, transparent 70%); border-radius: 50%; animation: nebulaFloat 18s ease-in-out infinite alternate-reverse; pointer-events: none; z-index: 0; }
  .nebula-3 { position: fixed; top: 40%; left: 50%; transform: translateX(-50%); width: 900px; height: 300px; background: radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%); border-radius: 50%; animation: nebulaFloat 22s ease-in-out infinite alternate; pointer-events: none; z-index: 0; }
  @keyframes nebulaFloat { from { transform: translate(0,0) scale(1); } to { transform: translate(3%,5%) scale(1.08); } }

  /* ── TOAST ─────────────────────────────────────────────────────────────────── */
  .toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: #1e293b; border: 1px solid rgba(99,102,241,0.35);
    color: #e2e8f0; font-size: 12px; font-family: 'JetBrains Mono', monospace;
    padding: 10px 20px; border-radius: 10px;
    box-shadow: 0 8px 32px rgba(99,102,241,0.3);
    z-index: 9999; animation: toastIn 0.25s ease;
    white-space: nowrap;
  }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  /* ── DROPDOWN ──────────────────────────────────────────────────────────────── */
  .dropdown-wrap { position: relative; }
  .dropdown-menu {
    position: absolute; top: calc(100% + 8px); left: 0; min-width: 160px;
    background: #1e293b; border: 1px solid rgba(99,102,241,0.25);
    border-radius: 10px; overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1);
    z-index: 500; animation: dropIn 0.18s ease;
  }
  @keyframes dropIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .dropdown-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; font-size: 12px; color: #94a3b8;
    cursor: pointer; font-family: 'JetBrains Mono', monospace;
    transition: all 0.15s; border-bottom: 1px solid rgba(99,102,241,0.06);
  }
  .dropdown-item:last-child { border-bottom: none; }
  .dropdown-item:hover { background: rgba(99,102,241,0.12); color: #c4b5fd; }
  .dropdown-item.selected { color: #818cf8; background: rgba(99,102,241,0.1); }
  .dropdown-dot { width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #22d3ee); }

  /* ── SETTINGS PANEL ────────────────────────────────────────────────────────── */
  .settings-panel {
    position: absolute; top: calc(100% + 8px); right: 0; width: 220px;
    background: #1e293b; border: 1px solid rgba(99,102,241,0.2);
    border-radius: 12px; padding: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    z-index: 500; animation: dropIn 0.18s ease;
  }
  .settings-title { font-size: 10px; color: #475569; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .settings-label { font-size: 11px; color: #94a3b8; }
  .settings-val { font-size: 11px; color: #818cf8; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 5px; padding: 2px 8px; cursor: pointer; transition: all 0.15s; }
  .settings-val:hover { background: rgba(99,102,241,0.2); color: #c4b5fd; }
  .settings-divider { height: 1px; background: rgba(99,102,241,0.1); margin: 10px 0; }
  .settings-link { font-size: 11px; color: #6366f1; cursor: pointer; transition: color 0.15s; }
  .settings-link:hover { color: #818cf8; }

  /* ── NAVBAR ───────────────────────────────────────────────────────────────── */
  .navbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    height: 56px; display: flex; align-items: center;
    background: rgba(13,17,23,0.97);
    backdrop-filter: blur(24px) saturate(1.6);
    border-bottom: 1px solid rgba(99,102,241,0.15);
  }
  .nav-brand {
    display: flex; align-items: center; gap: 10px;
    padding: 0 20px; cursor: pointer; height: 100%;
    border-right: 1px solid rgba(99,102,241,0.12);
    flex-shrink: 0; min-width: 196px; transition: background 0.2s;
  }
  .nav-brand:hover { background: rgba(99,102,241,0.06); }
  .nav-logo-icon {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #22d3ee 100%);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 13px; color: white;
    box-shadow: 0 0 14px rgba(99,102,241,0.5), 0 0 28px rgba(34,211,238,0.2);
    animation: logoFloat 3s ease-in-out infinite; flex-shrink: 0;
  }
  @keyframes logoFloat {
    0%,100%{transform:translateY(0px);box-shadow:0 0 14px rgba(99,102,241,0.5),0 0 28px rgba(34,211,238,0.2);}
    50%{transform:translateY(-4px);box-shadow:0 6px 24px rgba(99,102,241,0.7),0 0 40px rgba(34,211,238,0.3);}
  }
  .nav-logo-text { font-size: 15px; font-weight: 900; background: linear-gradient(135deg, #818cf8, #c4b5fd, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.3px; white-space: nowrap; }

  .nav-toolbar { flex: 1; display: flex; align-items: center; gap: 8px; padding: 0 16px; height: 100%; }
  .nav-lang-selector {
    display: flex; align-items: center; gap: 6px;
    background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25);
    border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #a5b4fc; cursor: pointer;
    font-family: inherit; font-weight: 600; transition: all 0.2s; white-space: nowrap;
  }
  .nav-lang-selector:hover, .nav-lang-selector.open { background: rgba(99,102,241,0.2); border-color: #6366f1; color: #c4b5fd; }
  .lang-dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #22d3ee); box-shadow: 0 0 6px rgba(99,102,241,0.6); }
  .nav-run-btn {
    display: flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none; color: white; padding: 7px 18px; border-radius: 8px; cursor: pointer;
    font-size: 12px; font-family: inherit; font-weight: 700;
    box-shadow: 0 4px 14px rgba(99,102,241,0.4); transition: all 0.22s; white-space: nowrap;
  }
  .nav-run-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(99,102,241,0.55); }
  .nav-run-icon { width: 0; height: 0; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 8px solid white; }
  .nav-review-btn {
    display: flex; align-items: center; gap: 6px;
    background: rgba(34,211,238,0.08); border: 1px solid rgba(34,211,238,0.28);
    color: #22d3ee; padding: 6px 14px; border-radius: 8px; cursor: pointer;
    font-size: 12px; font-family: inherit; font-weight: 600; transition: all 0.22s; white-space: nowrap;
  }
  .nav-review-btn:hover { background: rgba(34,211,238,0.16); box-shadow: 0 0 18px rgba(34,211,238,0.22); }
  .nav-sep { width: 1px; height: 28px; background: rgba(99,102,241,0.15); margin: 0 4px; }
  .nav-icon-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; font-size: 16px; border-radius: 8px; color: #475569; transition: all 0.2s; position: relative; }
  .nav-icon-btn:hover, .nav-icon-btn.open { background: rgba(99,102,241,0.12); color: #a5b4fc; }
  .nav-right { display: flex; align-items: center; gap: 6px; padding: 0 16px; height: 100%; border-left: 1px solid rgba(99,102,241,0.12); }
  .btn-ghost { background: transparent; border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; padding: 7px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-family: inherit; font-weight: 600; transition: all 0.22s; }
  .btn-ghost:hover { background: rgba(99,102,241,0.1); border-color: #6366f1; color: #c4b5fd; }
  .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; padding: 7px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-family: inherit; font-weight: 700; box-shadow: 0 4px 14px rgba(99,102,241,0.35); transition: all 0.22s; }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(99,102,241,0.5); }

  /* ── LEFT SIDEBAR ─────────────────────────────────────────────────────────── */
  .sidebar {
    position: fixed; top: 56px; left: 0; bottom: 0; width: 52px; z-index: 100;
    background: rgba(13,17,23,0.97); border-right: 1px solid rgba(99,102,241,0.12);
    display: flex; flex-direction: column; align-items: center;
    padding: 12px 0; gap: 4px; backdrop-filter: blur(20px);
  }
  .sidebar-icon { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; font-size: 17px; border-radius: 10px; color: #475569; transition: all 0.22s; position: relative; }
  .sidebar-icon:hover { background: rgba(99,102,241,0.12); color: #a5b4fc; transform: scale(1.08); }
  .sidebar-icon.active { background: rgba(99,102,241,0.18); color: #818cf8; box-shadow: 0 0 12px rgba(99,102,241,0.25); }
  .sidebar-tooltip { position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%); background: #1e293b; border: 1px solid rgba(99,102,241,0.2); color: #e2e8f0; font-size: 11px; font-family: 'JetBrains Mono', monospace; padding: 4px 10px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s; box-shadow: 0 4px 12px rgba(0,0,0,0.4); z-index: 300; }
  .sidebar-icon:hover .sidebar-tooltip { opacity: 1; }
  .sidebar-bottom { margin-top: auto; display: flex; flex-direction: column; gap: 4px; }

  /* ── LAYOUT OFFSET ────────────────────────────────────────────────────────── */
  .main-offset { margin-left: 52px; padding-top: 56px; }

  /* ── HERO (split panel) ───────────────────────────────────────────────────── */
  .hero {
    position: relative; z-index: 1;
    min-height: calc(100vh - 56px);
    display: grid; grid-template-columns: 1fr 1fr;
    align-items: center; padding: 60px 56px 60px 48px;
    max-width: 1400px; margin: 0 auto;
  }
  .hero-left { padding-right: 52px; }
  /* ── HERO CHIPS (badge row) ───────────────────────────────────────────────── */
  .hero-chips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; animation: fadeUp 0.6s ease both; }
  .hero-chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.22);
    border-radius: 8px; padding: 5px 12px; font-size: 11px; color: #94a3b8;
    font-weight: 600; letter-spacing: 0.04em; transition: all 0.2s;
  }
  .hero-chip:hover { background: rgba(99,102,241,0.16); border-color: rgba(99,102,241,0.4); color: #c4b5fd; }
  .chip-icon { font-size: 12px; }

  /* ── HERO TITLE ────────────────────────────────────────────────────────────── */
  .hero-title { font-size: clamp(42px, 5.5vw, 80px); font-weight: 900; line-height: 1.0; letter-spacing: -3px; margin-bottom: 24px; animation: fadeUp 0.7s 0.1s ease both; display: block; }
  .title-bracket { font-size: 0.55em; color: rgba(99,102,241,0.5); font-weight: 700; letter-spacing: 0; margin-right: 4px; vertical-align: middle; font-family: 'JetBrains Mono', monospace; }
  .title-code { color: #f1f5f9; -webkit-text-fill-color: #f1f5f9; }
  .title-review { background: linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #22d3ee 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .title-tagline { font-size: 0.6em; font-weight: 700; letter-spacing: -1px; background: linear-gradient(135deg, #475569, #64748b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: inline-block; margin-top: 4px; }
  .hero-sub { font-size: clamp(13px, 1.5vw, 16px); color: #64748b; line-height: 1.75; margin-bottom: 36px; max-width: 480px; animation: fadeUp 0.8s 0.2s ease both; }
  .hero-sub em { color: #94a3b8; font-style: normal; }
  .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; animation: fadeUp 0.9s 0.3s ease both; }
  .btn-hero-main { background: linear-gradient(135deg, #6366f1, #8b5cf6, #6366f1); background-size: 200% 200%; animation: gradientShift 3s ease infinite; border: none; color: white; padding: 14px 36px; border-radius: 12px; cursor: pointer; font-size: 14px; font-family: inherit; font-weight: 800; box-shadow: 0 8px 28px rgba(99,102,241,0.45); transition: transform 0.25s, box-shadow 0.25s; }
  @keyframes gradientShift { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }
  .btn-hero-main:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 14px 40px rgba(99,102,241,0.6); }
  .btn-hero-outline { background: transparent; border: 1px solid rgba(34,211,238,0.4); color: #22d3ee; padding: 13px 36px; border-radius: 12px; cursor: pointer; font-size: 14px; font-family: inherit; font-weight: 700; transition: all 0.25s; }
  .btn-hero-outline:hover { background: rgba(34,211,238,0.07); box-shadow: 0 0 28px rgba(34,211,238,0.2); transform: translateY(-2px); }
  .lang-ticker { margin-top: 40px; animation: fadeUp 1s 0.5s ease both; }
  .lang-ticker-label { font-size: 10px; color: #334155; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
  .lang-pills { display: flex; gap: 7px; flex-wrap: wrap; }
  .lang-pill { background: rgba(15,23,42,0.8); border: 1px solid rgba(99,102,241,0.15); border-radius: 6px; padding: 4px 11px; font-size: 11px; color: #475569; transition: all 0.2s; cursor: pointer; }
  .lang-pill:hover { border-color: rgba(99,102,241,0.5); color: #818cf8; background: rgba(99,102,241,0.1); transform: translateY(-1px); }
  .scroll-hint { margin-top: 48px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; color: #334155; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; animation: fadeUp 1s 0.6s ease both; cursor: pointer; }
  .scroll-chevron { width: 20px; height: 20px; border-right: 2px solid #334155; border-bottom: 2px solid #334155; transform: rotate(45deg); animation: chevronBounce 1.6s ease-in-out infinite; }
  @keyframes chevronBounce { 0%,100%{transform:rotate(45deg) translate(0,0);opacity:0.4;} 50%{transform:rotate(45deg) translate(4px,4px);opacity:1;} }
  .hero-right { position: relative; animation: fadeUp 0.8s 0.4s ease both; }

  /* ── EDITOR MOCK ──────────────────────────────────────────────────────────── */
  .editor-mock { background: #0d1117; border: 1px solid rgba(99,102,241,0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 0 0 1px rgba(99,102,241,0.06), 0 32px 80px rgba(99,102,241,0.18), 0 8px 32px rgba(0,0,0,0.5); position: relative; }
  .editor-mock::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(34,211,238,0.4), transparent); }
  .em-titlebar { height: 44px; display: flex; align-items: center; background: #161b22; border-bottom: 1px solid rgba(99,102,241,0.12); padding: 0 12px; gap: 10px; }
  .em-dots { display: flex; gap: 6px; align-items: center; }
  .em-dot { width: 11px; height: 11px; border-radius: 50%; }
  .em-dot-r { background: #ff5f57; box-shadow: 0 0 6px rgba(255,95,87,0.4); }
  .em-dot-y { background: #febc2e; box-shadow: 0 0 6px rgba(254,188,46,0.4); }
  .em-dot-g { background: #28c840; box-shadow: 0 0 6px rgba(40,200,64,0.4); }
  .em-tabs { display: flex; align-items: stretch; gap: 2px; flex: 1; height: 100%; }
  .em-tab { display: flex; align-items: center; gap: 6px; padding: 0 14px; font-size: 11px; color: #475569; cursor: pointer; border-right: 1px solid rgba(99,102,241,0.1); transition: all 0.2s; }
  .em-tab:hover { background: rgba(99,102,241,0.07); color: #818cf8; }
  .em-tab-active { background: rgba(99,102,241,0.12); color: #a5b4fc; border-bottom: 2px solid #6366f1; }
  .em-tab-icon { font-size: 12px; color: #6366f1; }
  .em-actions { display: flex; align-items: center; gap: 8px; }
  .em-lang-pill { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 6px; padding: 4px 10px; font-size: 10px; color: #818cf8; cursor: pointer; transition: all 0.2s; }
  .em-lang-pill:hover { background: rgba(99,102,241,0.2); }
  .em-run-btn { display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-family: inherit; font-weight: 700; cursor: pointer; box-shadow: 0 2px 10px rgba(99,102,241,0.4); transition: all 0.2s; }
  .em-run-btn:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.6); transform: translateY(-1px); }
  .em-run-btn span { font-size: 8px; }
  .em-run-running { opacity: 0.75; cursor: wait; }
  .em-body { display: flex; height: 200px; overflow: hidden; background: #0d1117; }
  .em-gutter { width: 40px; display: flex; flex-direction: column; padding: 12px 8px; gap: 2px; background: #0d1117; border-right: 1px solid rgba(99,102,241,0.06); user-select: none; }
  .em-lnum { font-size: 10px; color: #334155; text-align: right; line-height: 1.8; transition: opacity 0.3s; }
  .em-code { flex: 1; padding: 12px 16px; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
  .em-line { font-size: 11px; line-height: 1.8; white-space: nowrap; }
  .em-cursor-line { display: flex; align-items: center; margin-top: 2px; }
  .em-cursor { width: 2px; height: 14px; background: #6366f1; animation: blink 1s step-end infinite; display: inline-block; }
  @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .em-output { background: #161b22; border-top: 1px solid rgba(99,102,241,0.12); }
  .em-output-tabs { display: flex; border-bottom: 1px solid rgba(99,102,241,0.1); padding: 0 12px; gap: 4px; }
  .em-otab { padding: 8px 14px; font-size: 10px; color: #475569; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
  .em-otab:hover { color: #818cf8; }
  .em-otab-active { color: #a5b4fc; border-bottom-color: #6366f1; }
  .em-output-body { padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; min-height: 72px; }
  .em-output-label { font-size: 9px; color: #334155; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
  .em-output-line { font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 8px; }
  .em-check { color: #22d3ee; font-weight: 700; }
  .em-warn { color: #f59e0b; }
  .em-info { color: #818cf8; }
  .em-score { color: #22d3ee; font-weight: 700; }
  .editor-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 110%; height: 110%; z-index: -1; background: radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%); border-radius: 50%; pointer-events: none; animation: editorGlow 4s ease-in-out infinite alternate; }
  @keyframes editorGlow { from{opacity:0.6;transform:translate(-50%,-50%) scale(1);} to{opacity:1;transform:translate(-50%,-50%) scale(1.05);} }

  /* ── STATS ────────────────────────────────────────────────────────────────── */
  .stats-wrap { position: relative; z-index: 1; background: rgba(13,17,23,0.7); border-top: 1px solid rgba(99,102,241,0.1); border-bottom: 1px solid rgba(99,102,241,0.1); backdrop-filter: blur(12px); }
  .stats-inner { max-width: 900px; margin: 0 auto; display: flex; justify-content: center; }
  .stat-item { flex: 1; text-align: center; padding: 32px 40px; border-right: 1px solid rgba(99,102,241,0.1); transition: background 0.3s; }
  .stat-item:last-child { border-right: none; }
  .stat-item:hover { background: rgba(99,102,241,0.04); }
  .stat-num { font-size: 32px; font-weight: 900; background: linear-gradient(135deg, #818cf8, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .stat-label { font-size: 11px; color: #475569; margin-top: 6px; letter-spacing: 0.06em; }

  /* ── SECTIONS ─────────────────────────────────────────────────────────────── */
  .section { position: relative; z-index: 1; padding: 100px 24px; }
  .section-inner { max-width: 1150px; margin: 0 auto; }
  .section-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 999px; padding: 5px 14px; font-size: 11px; color: #818cf8; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.1em; }
  .section-title { font-size: clamp(26px, 4vw, 42px); font-weight: 900; letter-spacing: -1.5px; margin-bottom: 12px; text-align: center; }
  .section-sub { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 56px; text-align: center; }
  .grad { background: linear-gradient(135deg, #818cf8, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

  /* ── FEATURES ─────────────────────────────────────────────────────────────── */
  .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
  .feat-card { background: linear-gradient(145deg, #0d1117, #0f172a); border: 1px solid rgba(99,102,241,0.12); border-radius: 18px; padding: 28px; cursor: pointer; position: relative; overflow: hidden; transition: transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s, border-color 0.4s; }
  .feat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent); transform: scaleX(0); transition: transform 0.4s; }
  .feat-card:hover { transform: translateY(-8px) scale(1.012); box-shadow: 0 20px 52px rgba(99,102,241,0.18), 0 8px 24px rgba(0,0,0,0.4); border-color: rgba(99,102,241,0.3); }
  .feat-card:hover::before { transform: scaleX(1); }
  .feat-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .feat-icon-wrap { width: 48px; height: 48px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; transition: transform 0.4s, box-shadow 0.4s; }
  .feat-card:hover .feat-icon-wrap { transform: translateY(-3px) scale(1.1); box-shadow: 0 8px 20px rgba(99,102,241,0.3); }
  .feat-tag { font-size: 9px; color: #6366f1; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 4px; padding: 2px 8px; letter-spacing: 0.08em; font-weight: 700; }
  .feat-title { font-size: 15px; font-weight: 800; color: #e2e8f0; margin-bottom: 8px; }
  .feat-desc { font-size: 12px; color: #475569; line-height: 1.75; }
  .feat-arrow { position: absolute; bottom: 20px; right: 22px; font-size: 14px; color: #334155; transition: all 0.3s; }
  .feat-card:hover .feat-arrow { color: #6366f1; transform: translate(3px, -3px); }

  /* ── STEPS ────────────────────────────────────────────────────────────────── */
  .steps-section { background: linear-gradient(180deg, #0d1117 0%, #010409 100%); position: relative; z-index: 1; overflow: hidden; }
  .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; position: relative; }
  .steps-grid::before { content: ''; position: absolute; top: 32px; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(34,211,238,0.5), transparent); z-index: 0; box-shadow: 0 0 15px rgba(34,211,238,0.4); }
  
  .step-card { background: rgba(13, 17, 23, 0.6); border: 1px solid rgba(99,102,241,0.15); border-radius: 24px; padding: 40px 32px; position: relative; overflow: hidden; z-index: 1; transition: all 0.4s cubic-bezier(0.23,1,0.32,1); cursor: pointer; backdrop-filter: blur(12px); box-shadow: 0 4px 24px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05); }
  .step-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -8px rgba(99,102,241,0.15), 0 0 0 1px rgba(34,211,238,0.3), inset 0 1px 0 rgba(255,255,255,0.1); background: rgba(13, 17, 23, 0.8); }
  
  .step-orb { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.15)); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; position: relative; box-shadow: 0 0 20px rgba(99,102,241,0.2) inset; transition: transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s; }
  .step-card:hover .step-orb { transform: scale(1.1) rotate(5deg); box-shadow: 0 0 30px rgba(34,211,238,0.3) inset, 0 0 20px rgba(99,102,241,0.4); border-color: rgba(255,255,255,0.2); }
  .step-num { font-size: 20px; font-weight: 800; font-family: 'Inter', 'JetBrains Mono', sans-serif; background: linear-gradient(135deg, #a5b4fc, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  
  .step-watermark { position: absolute; top: -20px; right: -10px; font-size: 140px; font-weight: 900; color: rgba(255,255,255,0.02); z-index: -1; transition: color 0.4s, transform 0.4s; pointer-events: none; font-family: 'Inter', 'JetBrains Mono', sans-serif; }
  .step-card:hover .step-watermark { color: rgba(99,102,241,0.06); transform: scale(1.05) translate(-5px, 5px); }
  
  .step-title { font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; letter-spacing: -0.3px; }
  .step-desc { font-size: 13px; color: #94a3b8; line-height: 1.7; font-weight: 400; }

  /* ── CTA ──────────────────────────────────────────────────────────────────── */
  .cta-section { position: relative; z-index: 1; padding: 90px 24px; text-align: center; }
  .cta-card { max-width: 700px; margin: 0 auto; background: linear-gradient(145deg, #0d1117, #0f172a); border: 1px solid rgba(99,102,241,0.2); border-radius: 28px; padding: 64px 48px; box-shadow: 0 0 0 1px rgba(99,102,241,0.05), 0 32px 80px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.04); position: relative; overflow: hidden; }
  .cta-card::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 400px; height: 200px; background: radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%); pointer-events: none; }
  .cta-title { font-size: clamp(28px, 4vw, 44px); font-weight: 900; letter-spacing: -1.5px; margin-bottom: 16px; line-height: 1.1; }
  .cta-sub { font-size: 14px; color: #475569; margin-bottom: 36px; line-height: 1.7; }
  .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  /* ── FOOTER ───────────────────────────────────────────────────────────────── */
  .footer { position: relative; z-index: 1; border-top: 1px solid rgba(99,102,241,0.15); padding: 44px 64px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 28px; background: rgba(1,4,9,0.95); backdrop-filter: blur(20px); }
  .footer-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .footer-logo-icon { width: 28px; height: 28px; background: linear-gradient(135deg, #6366f1, #22d3ee); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: 900; box-shadow: 0 4px 12px rgba(99,102,241,0.3); animation: logoFloat 3s ease-in-out infinite; }
  .footer-logo-text { font-size: 14px; font-weight: 800; background: linear-gradient(135deg, #a5b4fc, #67e8f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .footer-links { display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; }
  .footer-link { background: none; border: none; color: #94a3b8; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 500; transition: all 0.3s; }
  .footer-link:hover { color: #e2e8f0; text-shadow: 0 0 10px rgba(226,232,240,0.4); transform: translateY(-1px); }
  .footer-credit { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .footer-copy { font-size: 12px; color: #64748b; }
  .designer-tag { font-size: 12px; background: linear-gradient(135deg, #a5b4fc, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 800; letter-spacing: 0.5px; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 900px) {
    .sidebar { display: none; }
    .main-offset { margin-left: 0; }
    .hero { grid-template-columns: 1fr; padding: 48px 24px; }
    .hero-right { display: none; }
    .nav-brand { min-width: unset; }
    .footer { flex-direction: column; text-align: center; padding: 32px 24px; }
    .footer-credit { align-items: center; }
    .cta-card { padding: 40px 24px; }
    .stats-inner { flex-wrap: wrap; }
    .stat-item { width: 50%; border-right: none; border-bottom: 1px solid rgba(99,102,241,0.1); padding: 20px; }
    .steps-grid::before { display: none; }
  }
  @media (max-width: 600px) {
    .nav-review-btn, .nav-sep { display: none; }
  }
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const featRef = useRef(null);
  const stepsRef = useRef(null);
  const ctaRef = useRef(null);

  // UI state
  const [activeSidebar, setActiveSidebar] = useState("files");
  const [selectedLang, setSelectedLang] = useState("JavaScript");
  const [langOpen, setLangOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = "CodeReview AI — AI-powered code review & execution";
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => { setLangOpen(false); setSettingsOpen(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const showToast = useCallback((msg) => setToast(msg), []);

  const handleShare = useCallback((e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href).then(() => showToast("🔗 Link copied to clipboard!")).catch(() => showToast("📋 Copy: " + window.location.href));
    setSettingsOpen(false);
  }, [showToast]);

  const handleLangSelect = useCallback((lang) => {
    setSelectedLang(lang);
    setLangOpen(false);
    showToast(`✓ Language set to ${lang}`);
  }, [showToast]);

  const sidebarItems = [
    { id: "files",    icon: "≡",  label: "Explorer",        action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
    { id: "search",   icon: "🔍", label: "Search Features",  action: () => featRef.current?.scrollIntoView({ behavior: "smooth" }) },
    { id: "git",      icon: "⑂",  label: "How It Works",    action: () => stepsRef.current?.scrollIntoView({ behavior: "smooth" }) },
    { id: "ai",       icon: "🤖", label: "AI Review",        action: () => navigate("/editor") },
    { id: "terminal", icon: "⌨", label: "Open Editor",      action: () => navigate("/editor") },
  ];

  return (
    <div className="land">
      <style>{styles}</style>
      <StarField />
      <div className="nebula-1" /><div className="nebula-2" /><div className="nebula-3" />

      {/* Toast */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="navbar">
        {/* Brand */}
        <div className="nav-brand" onClick={() => navigate("/")}>
          <div className="nav-logo-icon">&lt;/&gt;</div>
          <span className="nav-logo-text">CodeReview AI</span>
        </div>

        {/* Center toolbar */}
        <div className="nav-toolbar">
          {/* Language selector */}
          <div className="dropdown-wrap" onClick={e => e.stopPropagation()}>
            <button className={`nav-lang-selector ${langOpen ? "open" : ""}`}
              onClick={() => { setLangOpen(o => !o); setSettingsOpen(false); }}>
              <span className="lang-dot" />{selectedLang} ▾
            </button>
            {langOpen && (
              <div className="dropdown-menu">
                {LANG_LIST.map(lang => (
                  <div key={lang} className={`dropdown-item ${selectedLang === lang ? "selected" : ""}`}
                    onClick={() => handleLangSelect(lang)}>
                    <span className="dropdown-dot" />{lang}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="nav-sep" />

          {/* Run button → editor */}
          <button className="nav-run-btn" onClick={() => navigate("/editor")}>
            <span className="nav-run-icon" />Run
          </button>

          {/* AI Review button → editor */}
          <button className="nav-review-btn" onClick={() => navigate("/editor")}>
            🤖 AI Review
          </button>

          <div className="nav-sep" />

          {/* Settings */}
          <div className="dropdown-wrap" onClick={e => e.stopPropagation()}>
            <button className={`nav-icon-btn ${settingsOpen ? "open" : ""}`} title="Settings"
              onClick={() => { setSettingsOpen(o => !o); setLangOpen(false); }}>⚙</button>
            {settingsOpen && (
              <div className="settings-panel">
                <div className="settings-title">Preferences</div>
                <div className="settings-row">
                  <span className="settings-label">Language</span>
                  <span className="settings-val" onClick={() => { setSettingsOpen(false); setLangOpen(true); }}>{selectedLang} ▾</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Theme</span>
                  <span className="settings-val">Dark</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Font Size</span>
                  <span className="settings-val">14px</span>
                </div>
                <div className="settings-divider" />
                <div className="settings-link" onClick={() => { setSettingsOpen(false); navigate("/editor"); }}>
                  → Open full editor settings
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle → show toast */}
          <button className="nav-icon-btn" title="Toggle Theme"
            onClick={() => showToast("🌙 Dark mode is always on — you're a coder!")}>☀</button>

          {/* Share */}
          <button className="nav-icon-btn" title="Share" onClick={handleShare}>⎋</button>
        </div>

        {/* Right auth actions */}
        <div className="nav-right">
          {user ? (
            <>
              <button className="btn-ghost" onClick={() => navigate("/dashboard")}>📊 Dashboard</button>
              <button className="btn-primary" onClick={() => navigate("/editor")}>⚡ Editor</button>
            </>
          ) : (
            <>
              <button id="nav-login-btn" className="btn-ghost" onClick={() => navigate("/login")}>Login</button>
              <button id="nav-signup-btn" className="btn-primary" onClick={() => navigate("/signup")}>🚀 Launch Free</button>
            </>
          )}
        </div>
      </nav>

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        {sidebarItems.map(item => (
          <button key={item.id}
            className={`sidebar-icon ${activeSidebar === item.id ? "active" : ""}`}
            onClick={() => { setActiveSidebar(item.id); item.action(); }}>
            {item.icon}
            <span className="sidebar-tooltip">{item.label}</span>
          </button>
        ))}
        <div className="sidebar-bottom">
          <button className="sidebar-icon"
            onClick={() => navigate(user ? "/dashboard" : "/login")}>
            👤<span className="sidebar-tooltip">{user ? "Dashboard" : "Account"}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <div className="main-offset">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero-left">
            <div className="hero-chips">
              <span className="hero-chip"><span className="chip-icon">🤖</span>AI-Powered</span>
              <span className="hero-chip"><span className="chip-icon">⚡</span>Instant Reviews</span>
              <span className="hero-chip"><span className="chip-icon">🌌</span>Multi-Language</span>
            </div>
            <h1 className="hero-title">
              <span className="title-bracket">&lt;/&gt;</span>
              <span className="title-code">Code</span><span className="title-review">Review</span>
              <br />
              <span className="title-tagline">Ship to Orbit</span>
            </h1>
            <p className="hero-sub">
              <em>AI-powered code review & execution platform.</em><br />
              Write, run, and review across languages — all in one cosmic workspace.
            </p>
            <div className="hero-cta">
              <button id="hero-try-btn" className="btn-hero-main" onClick={() => navigate("/editor")}>⚡ Open Editor</button>
              <button id="hero-signup-btn" className="btn-hero-outline" onClick={() => navigate("/signup")}>🌌 Sign Up Free</button>
            </div>
            <div className="lang-ticker">
              <div className="lang-ticker-label">Supported Languages</div>
              <div className="lang-pills">
                {LANG_LIST.map(l => (
                  <div className="lang-pill" key={l}
                    onClick={() => { handleLangSelect(l); navigate("/editor"); }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
            <div className="scroll-hint" onClick={() => featRef.current?.scrollIntoView({ behavior: "smooth" })}>
              <span>Explore features</span>
              <div className="scroll-chevron" />
            </div>
          </div>

          {/* Right: live editor mock */}
          <div className="hero-right">
            <div className="editor-glow" />
            <EditorMock onRun={() => navigate("/editor")} />
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        <div className="stats-wrap">
          <div className="stats-inner">
            {[{ num: "6+", label: "Languages" }, { num: "5+", label: "AI Models" }, { num: "∞", label: "Executions" }, { num: "100%", label: "Free to Start" }].map(s => (
              <div className="stat-item" key={s.label} onClick={() => navigate("/editor")} style={{ cursor: "pointer" }}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ──────────────────────────────────────────────────────── */}
        <section className="section" ref={featRef} id="features">
          <div className="section-inner">
            <div style={{ textAlign: "center" }}><div className="section-tag">✦ Core Features</div></div>
            <h2 className="section-title">Tools that <span className="grad">defy gravity</span></h2>
            <p className="section-sub">Everything you need to write, review, and ship better code — floating at the edge of space.</p>
            <div className="features-grid">
              {FEATURES.map(f => (
                <div className="feat-card" key={f.title} onClick={() => navigate(f.route)}>
                  <div className="feat-card-header">
                    <div className="feat-icon-wrap">{f.icon}</div>
                    <span className="feat-tag">{f.tag}</span>
                  </div>
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-desc">{f.desc}</div>
                  <span className="feat-arrow">→</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <section className="steps-section section" ref={stepsRef}>
          <div className="section-inner">
            <div style={{ textAlign: "center" }}><div className="section-tag">🚀 Launch Sequence</div></div>
            <h2 className="section-title">Three steps to <span className="grad">orbit</span></h2>
            <p className="section-sub">From first keystroke to production-ready code in under 60 seconds.</p>
            <div className="steps-grid">
              {STEPS.map((s, idx) => (
                <div className="step-card" key={s.num} onClick={() => navigate("/editor")}>
                  <div className="step-watermark">{s.num}</div>
                  <div className="step-orb">
                    <div className="step-num">{idx + 1}</div>
                  </div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section className="cta-section" ref={ctaRef}>
          <div className="cta-card">
            <h2 className="cta-title">Ready for <span className="grad">liftoff?</span></h2>
            <p className="cta-sub">Start coding for free — no account required.<br />Create a free account to unlock unlimited reviews and runs.</p>
            <div className="cta-btns">
              <button id="cta-try-btn" className="btn-hero-main" onClick={() => navigate("/editor")}>⚡ Enter the Editor</button>
              <button id="cta-signup-btn" className="btn-hero-outline" onClick={() => navigate("/signup")}>🌌 Create Free Account</button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <footer className="footer">
          <div className="footer-logo" onClick={() => navigate("/")}>
            <div className="footer-logo-icon">&lt;/&gt;</div>
            <span className="footer-logo-text">CodeReview AI</span>
          </div>
          <div className="footer-links">
            {[["Editor", "/editor"], ["Dashboard", "/dashboard"], ["Login", "/login"], ["Sign Up", "/signup"]].map(([label, path]) => (
              <button key={label} className="footer-link" onClick={() => navigate(path)}>{label}</button>
            ))}
          </div>
          <div className="footer-credit">
            <span className="footer-copy">© 2025 CodeReview AI</span>
            <span className="designer-tag" style={{ cursor: "pointer", transition: "opacity 0.2s" }}
              onMouseOver={e => e.target.style.opacity = 0.8} onMouseOut={e => e.target.style.opacity = 1}
              onClick={() => navigate("/designer")}>
              ✦ Designed & built by GOKUL R
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

