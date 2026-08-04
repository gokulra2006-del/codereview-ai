import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Terminal, Code, Play, CheckCircle, Search, FileCode2, Cpu, Zap, Server, MessageSquare, Timer, Globe, ChevronRight } from "lucide-react";

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
  { icon: <Cpu size={22} />, title: "Automated Review", desc: "Static analysis and context-aware insights detect bugs and anti-patterns immediately.", tag: "ANALYSIS", route: "/editor" },
  { icon: <Zap size={22} />, title: "Cloud Execution", desc: "Run C++, Python, Java & JavaScript securely in our isolated cloud environments.", tag: "EXECUTION", route: "/editor" },
  { icon: <Server size={22} />, title: "Parallel Testing", desc: "Evaluate multiple test cases simultaneously to verify correctness across edge cases.", tag: "TESTING", route: "/editor" },
  { icon: <MessageSquare size={22} />, title: "Contextual Chat", desc: "Discuss your code interactively. Ask questions, request optimizations, or debug errors.", tag: "CHAT", route: "/editor" },
  { icon: <Timer size={22} />, title: "Interview Prep", desc: "Practice with timed sessions ranging from 30 to 90 minutes. Build pressure resilience.", tag: "TIMED", route: "/editor" },
  { icon: <Globe size={22} />, title: "Multi-Language", desc: "Switch seamlessly between popular languages with pre-configured boilerplates.", tag: "LANGUAGES", route: "/editor" },
];

const STEPS = [
  { num: "01", title: "Write Code", desc: "Use the integrated Monaco editor. Benefit from syntax highlighting and familiar shortcuts." },
  { num: "02", title: "Execute & Analyze", desc: "Run your code instantly or request a comprehensive review. See results side-by-side." },
  { num: "03", title: "Iterate", desc: "Refine your solution, fix errors, and perfect your implementation until it passes all tests." },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; overflow-x: hidden; font-family: 'Inter', sans-serif; }
  .land { min-height: 100vh; background: #0a0a0a; color: #fafafa; font-family: 'Inter', sans-serif; position: relative; overflow-x: hidden; }

  /* Minimalist Background (removed glowing neon orbs) */
  .bg-grid { position: fixed; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; z-index: 0; pointer-events: none; }

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
    background: rgba(10, 10, 10, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #1f1f1f;
  }
  .nav-brand {
    display: flex; align-items: center; gap: 8px;
    padding: 0 20px; cursor: pointer; height: 100%;
    border-right: 1px solid #1f1f1f;
    flex-shrink: 0; min-width: 196px; transition: background 0.2s;
  }
  .nav-brand:hover { background: #141414; }
  .nav-logo-icon {
    width: 28px; height: 28px;
    background: #fafafa;
    border-radius: 6px; display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; color: #0a0a0a;
    flex-shrink: 0;
  }
  .nav-logo-text { font-size: 15px; font-weight: 600; color: #fafafa; letter-spacing: -0.2px; white-space: nowrap; }

  .nav-toolbar { flex: 1; display: flex; align-items: center; gap: 8px; padding: 0 16px; height: 100%; }
  .nav-lang-selector {
    display: flex; align-items: center; gap: 6px;
    background: #141414; border: 1px solid #262626;
    border-radius: 6px; padding: 6px 12px; font-size: 12px; color: #a3a3a3; cursor: pointer;
    font-family: 'JetBrains Mono', monospace; font-weight: 500; transition: all 0.2s; white-space: nowrap;
  }
  .nav-lang-selector:hover, .nav-lang-selector.open { background: #1f1f1f; border-color: #404040; color: #fafafa; }
  .lang-dot { width: 8px; height: 8px; border-radius: 50%; background: #525252; }
  .nav-run-btn {
    display: flex; align-items: center; gap: 7px;
    background: #fafafa; border: none; color: #0a0a0a; padding: 7px 18px; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 600; transition: all 0.2s; white-space: nowrap;
  }
  .nav-run-btn:hover { background: #e5e5e5; }
  .nav-run-icon { width: 0; height: 0; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 8px solid #0a0a0a; }
  .nav-review-btn {
    display: flex; align-items: center; gap: 6px;
    background: transparent; border: 1px solid #262626;
    color: #a3a3a3; padding: 6px 14px; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; transition: all 0.2s; white-space: nowrap;
  }
  .nav-review-btn:hover { background: #141414; color: #fafafa; border-color: #404040; }
  .nav-sep { width: 1px; height: 28px; background: #1f1f1f; margin: 0 4px; }
  .nav-icon-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; font-size: 16px; border-radius: 6px; color: #a3a3a3; transition: all 0.2s; position: relative; }
  .nav-icon-btn:hover, .nav-icon-btn.open { background: #141414; color: #fafafa; }
  .nav-right { display: flex; align-items: center; gap: 6px; padding: 0 16px; height: 100%; border-left: 1px solid #1f1f1f; }
  .btn-ghost { background: transparent; border: 1px solid #262626; color: #a3a3a3; padding: 7px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s; }
  .btn-ghost:hover { background: #141414; border-color: #404040; color: #fafafa; }
  .btn-primary { background: #fafafa; border: none; color: #0a0a0a; padding: 7px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
  .btn-primary:hover { background: #e5e5e5; }

  /* ── LEFT SIDEBAR ─────────────────────────────────────────────────────────── */
  .sidebar {
    position: fixed; top: 56px; left: 0; bottom: 0; width: 52px; z-index: 100;
    background: rgba(10, 10, 10, 0.9); border-right: 1px solid #1f1f1f;
    display: flex; flex-direction: column; align-items: center;
    padding: 12px 0; gap: 4px; backdrop-filter: blur(12px);
  }
  .sidebar-icon { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; font-size: 17px; border-radius: 6px; color: #737373; transition: all 0.2s; position: relative; }
  .sidebar-icon:hover { background: #141414; color: #fafafa; }
  .sidebar-icon.active { background: #1f1f1f; color: #fafafa; }
  .sidebar-tooltip { position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%); background: #1f1f1f; border: 1px solid #262626; color: #fafafa; font-size: 11px; padding: 4px 10px; border-radius: 4px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s; z-index: 300; }
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
    display: inline-flex; align-items: center; gap: 6px;
    background: #141414; border: 1px solid #262626;
    border-radius: 99px; padding: 4px 12px; font-size: 11px; color: #a3a3a3;
    font-weight: 500; transition: all 0.2s;
  }
  .hero-chip:hover { background: #1f1f1f; border-color: #404040; color: #fafafa; }

  /* ── HERO TITLE ────────────────────────────────────────────────────────────── */
  .hero-title { font-size: clamp(42px, 5.5vw, 80px); font-weight: 700; line-height: 1.05; letter-spacing: -2px; margin-bottom: 24px; animation: fadeUp 0.7s 0.1s ease both; display: block; color: #fafafa; }
  .title-code { color: #d4d4d4; font-weight: 500; font-family: 'JetBrains Mono', monospace; }
  .title-review { color: #fafafa; }
  .hero-sub { font-size: clamp(14px, 1.5vw, 16px); color: #a3a3a3; line-height: 1.6; margin-bottom: 36px; max-width: 480px; animation: fadeUp 0.8s 0.2s ease both; font-weight: 400; }
  .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; animation: fadeUp 0.9s 0.3s ease both; }
  .btn-hero-main { background: #fafafa; border: 1px solid #fafafa; color: #0a0a0a; padding: 12px 32px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; }
  .btn-hero-main:hover { background: #e5e5e5; }
  .btn-hero-outline { background: transparent; border: 1px solid #262626; color: #fafafa; padding: 12px 32px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
  .btn-hero-outline:hover { background: #141414; border-color: #404040; }
  .lang-ticker { margin-top: 40px; animation: fadeUp 1s 0.5s ease both; }
  .lang-ticker-label { font-size: 10px; color: #737373; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 10px; font-weight: 600; }
  .lang-pills { display: flex; gap: 8px; flex-wrap: wrap; }
  .lang-pill { background: #141414; border: 1px solid #262626; border-radius: 4px; padding: 4px 10px; font-size: 11px; color: #a3a3a3; transition: all 0.2s; cursor: pointer; font-family: 'JetBrains Mono', monospace; }
  .lang-pill:hover { border-color: #404040; color: #fafafa; background: #1f1f1f; }
  .scroll-hint { margin-top: 48px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; color: #737373; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; animation: fadeUp 1s 0.6s ease both; cursor: pointer; font-weight: 600; }
  .scroll-chevron { width: 20px; height: 20px; border-right: 2px solid #334155; border-bottom: 2px solid #334155; transform: rotate(45deg); animation: chevronBounce 1.6s ease-in-out infinite; }
  @keyframes chevronBounce { 0%,100%{transform:rotate(45deg) translate(0,0);opacity:0.4;} 50%{transform:rotate(45deg) translate(4px,4px);opacity:1;} }
  .hero-right { position: relative; animation: fadeUp 0.8s 0.4s ease both; }

  /* ── EDITOR MOCK ──────────────────────────────────────────────────────────── */
  .editor-mock { background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 8px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.5); position: relative; font-family: 'JetBrains Mono', monospace; }
  .em-titlebar { height: 36px; display: flex; align-items: center; background: #0a0a0a; border-bottom: 1px solid #1f1f1f; padding: 0 12px; gap: 10px; }
  .em-dots { display: flex; gap: 6px; align-items: center; }
  .em-dot { width: 10px; height: 10px; border-radius: 50%; }
  .em-dot-r { background: #333; }
  .em-dot-y { background: #333; }
  .em-dot-g { background: #333; }
  .em-tabs { display: flex; align-items: stretch; gap: 2px; flex: 1; height: 100%; margin-left: 10px; }
  .em-tab { display: flex; align-items: center; gap: 6px; padding: 0 14px; font-size: 11px; color: #737373; cursor: pointer; transition: all 0.2s; }
  .em-tab:hover { color: #fafafa; }
  .em-tab-active { color: #fafafa; border-bottom: 1px solid #fafafa; }
  .em-actions { display: flex; align-items: center; gap: 8px; }
  .em-lang-pill { background: #141414; border: 1px solid #262626; border-radius: 4px; padding: 3px 8px; font-size: 10px; color: #a3a3a3; cursor: pointer; transition: all 0.2s; }
  .em-run-btn { display: flex; align-items: center; gap: 6px; background: #fafafa; border: none; color: #0a0a0a; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .em-run-running { opacity: 0.75; cursor: wait; }
  .em-body { display: flex; height: 200px; overflow: hidden; background: #0a0a0a; }
  .em-gutter { width: 40px; display: flex; flex-direction: column; padding: 12px 8px; gap: 2px; background: #0a0a0a; border-right: 1px solid #1f1f1f; user-select: none; }
  .em-lnum { font-size: 11px; color: #404040; text-align: right; line-height: 1.8; transition: opacity 0.3s; }
  .em-code { flex: 1; padding: 12px 16px; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
  .em-line { font-size: 11px; line-height: 1.8; white-space: nowrap; color: #d4d4d4; }
  .em-cursor-line { display: flex; align-items: center; margin-top: 2px; }
  .em-cursor { width: 2px; height: 14px; background: #fafafa; animation: blink 1s step-end infinite; display: inline-block; }
  @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .em-output { background: #0a0a0a; border-top: 1px solid #1f1f1f; }
  .em-output-tabs { display: flex; border-bottom: 1px solid #1f1f1f; padding: 0 12px; gap: 4px; }
  .em-otab { padding: 8px 14px; font-size: 11px; color: #737373; cursor: pointer; border-bottom: 1px solid transparent; transition: all 0.2s; }
  .em-otab:hover { color: #fafafa; }
  .em-otab-active { color: #fafafa; border-bottom-color: #fafafa; }
  .em-output-body { padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; min-height: 72px; }
  .em-output-label { font-size: 10px; color: #737373; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 4px; }
  .em-output-line { font-size: 11px; color: #a3a3a3; display: flex; align-items: center; gap: 8px; }
  .em-check { color: #fafafa; font-weight: 500; }
  .em-warn { color: #a3a3a3; }
  .em-info { color: #d4d4d4; }
  .em-score { color: #fafafa; font-weight: 500; }

  /* ── STATS ────────────────────────────────────────────────────────────────── */
  .stats-wrap { position: relative; z-index: 1; background: #0a0a0a; border-top: 1px solid #1f1f1f; border-bottom: 1px solid #1f1f1f; }
  .stats-inner { max-width: 900px; margin: 0 auto; display: flex; justify-content: center; }
  .stat-item { flex: 1; text-align: center; padding: 32px 40px; border-right: 1px solid #1f1f1f; transition: background 0.3s; }
  .stat-item:last-child { border-right: none; }
  .stat-item:hover { background: #141414; }
  .stat-num { font-size: 32px; font-weight: 600; color: #fafafa; }
  .stat-label { font-size: 11px; color: #737373; margin-top: 6px; letter-spacing: 0.05em; text-transform: uppercase; }

  /* ── SECTIONS ─────────────────────────────────────────────────────────────── */
  .section { position: relative; z-index: 1; padding: 100px 24px; }
  .section-inner { max-width: 1150px; margin: 0 auto; }
  .section-tag { display: inline-flex; align-items: center; gap: 6px; background: #141414; border: 1px solid #262626; border-radius: 4px; padding: 4px 10px; font-size: 11px; color: #a3a3a3; margin-bottom: 14px; font-weight: 600; }
  .section-title { font-size: clamp(26px, 4vw, 36px); font-weight: 700; letter-spacing: -1px; margin-bottom: 12px; text-align: center; color: #fafafa; }
  .section-sub { font-size: 15px; color: #a3a3a3; line-height: 1.6; margin-bottom: 56px; text-align: center; font-weight: 400; }

  /* ── FEATURES ─────────────────────────────────────────────────────────────── */
  .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
  .feat-card { background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 8px; padding: 28px; cursor: pointer; position: relative; transition: all 0.2s; }
  .feat-card:hover { border-color: #404040; background: #141414; }
  .feat-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .feat-icon-wrap { width: 44px; height: 44px; background: #141414; border: 1px solid #262626; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #fafafa; transition: all 0.2s; }
  .feat-card:hover .feat-icon-wrap { background: #1f1f1f; border-color: #404040; }
  .feat-tag { font-size: 10px; color: #737373; background: transparent; border: 1px solid #262626; border-radius: 4px; padding: 2px 6px; font-weight: 500; }
  .feat-title { font-size: 15px; font-weight: 600; color: #fafafa; margin-bottom: 8px; }
  .feat-desc { font-size: 14px; color: #a3a3a3; line-height: 1.6; font-weight: 400; }
  .feat-arrow { position: absolute; bottom: 20px; right: 22px; color: #404040; transition: all 0.2s; }
  .feat-card:hover .feat-arrow { color: #fafafa; transform: translateX(3px); }

  /* ── STEPS ────────────────────────────────────────────────────────────────── */
  .steps-section { background: #0a0a0a; position: relative; z-index: 1; padding: 80px 0; border-top: 1px solid #1f1f1f; }
  .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; position: relative; }
  
  .step-card { background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 8px; padding: 32px; position: relative; z-index: 1; transition: all 0.2s; cursor: pointer; }
  .step-card:hover { border-color: #404040; background: #141414; }
  
  .step-orb { width: 48px; height: 48px; border-radius: 6px; background: #141414; border: 1px solid #262626; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; transition: all 0.2s; }
  .step-card:hover .step-orb { background: #1f1f1f; border-color: #404040; }
  .step-num { font-size: 16px; font-weight: 600; font-family: 'JetBrains Mono', monospace; color: #fafafa; }
  
  .step-title { font-size: 16px; font-weight: 600; color: #fafafa; margin-bottom: 12px; }
  .step-desc { font-size: 14px; color: #a3a3a3; line-height: 1.6; font-weight: 400; }

  /* ── CTA ──────────────────────────────────────────────────────────────────── */
  .cta-section { position: relative; z-index: 1; padding: 90px 24px; text-align: center; border-top: 1px solid #1f1f1f; }
  .cta-card { max-width: 700px; margin: 0 auto; background: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 64px 48px; position: relative; }
  .cta-title { font-size: clamp(28px, 4vw, 36px); font-weight: 700; letter-spacing: -1px; margin-bottom: 16px; line-height: 1.1; color: #fafafa; }
  .cta-sub { font-size: 15px; color: #a3a3a3; margin-bottom: 36px; line-height: 1.6; font-weight: 400; }
  .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  /* ── FOOTER ───────────────────────────────────────────────────────────────── */
  .footer { position: relative; z-index: 1; border-top: 1px solid #1f1f1f; padding: 44px 64px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 28px; background: #0a0a0a; }
  .footer-logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .footer-logo-icon { width: 24px; height: 24px; background: #fafafa; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #0a0a0a; font-weight: 700; }
  .footer-logo-text { font-size: 14px; font-weight: 600; color: #fafafa; }
  .footer-links { display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; }
  .footer-link { background: none; border: none; color: #737373; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
  .footer-link:hover { color: #fafafa; }
  .footer-credit { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .footer-copy { font-size: 12px; color: #737373; }
  .designer-tag { font-size: 12px; color: #a3a3a3; font-weight: 500; }

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
    { id: "files",    icon: <FileCode2 size={18} />,  label: "Explorer",        action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
    { id: "search",   icon: <Search size={18} />, label: "Search Features",  action: () => featRef.current?.scrollIntoView({ behavior: "smooth" }) },
    { id: "ai",       icon: <Cpu size={18} />, label: "AI Review",        action: () => navigate("/editor") },
    { id: "terminal", icon: <Terminal size={18} />, label: "Open Editor",      action: () => navigate("/editor") },
  ];

  return (
    <div className="land">
      <style>{styles}</style>
      <div className="bg-grid" />

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
              <span className="hero-chip"><Cpu size={12} />Analysis</span>
              <span className="hero-chip"><Zap size={12} />Execution</span>
              <span className="hero-chip"><Server size={12} />Cloud-native</span>
            </div>
            <h1 className="hero-title">
              <span className="title-code">Code.</span><br />
              <span className="title-review">Review.</span><br />
              <span className="title-code">Execute.</span>
            </h1>
            <p className="hero-sub">
              A comprehensive, cloud-based platform for modern developers. 
              Write code, run parallel tests, and receive contextual feedback 
              instantly in a minimal, distraction-free environment.
            </p>
            <div className="hero-cta">
              <button id="hero-try-btn" className="btn-hero-main" onClick={() => navigate("/editor")}>Open Editor</button>
              <button id="hero-signup-btn" className="btn-hero-outline" onClick={() => navigate("/signup")}>Sign Up Free</button>
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
            <div style={{ textAlign: "center" }}><div className="section-tag">Core Features</div></div>
            <h2 className="section-title">Tools that accelerate development</h2>
            <p className="section-sub">Everything you need to write, review, and ship better code.</p>
            <div className="features-grid">
              {FEATURES.map(f => (
                <div className="feat-card" key={f.title} onClick={() => navigate(f.route)}>
                  <div className="feat-card-header">
                    <div className="feat-icon-wrap">{f.icon}</div>
                    <span className="feat-tag">{f.tag}</span>
                  </div>
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-desc">{f.desc}</div>
                  <span className="feat-arrow"><ChevronRight size={16} /></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <section className="steps-section section" ref={stepsRef}>
          <div className="section-inner">
            <div style={{ textAlign: "center" }}><div className="section-tag">Workflow</div></div>
            <h2 className="section-title">Three steps to deployment</h2>
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
            <h2 className="cta-title">Ready to start?</h2>
            <p className="cta-sub">Start coding for free — no account required.<br />Create a free account to unlock unlimited reviews and runs.</p>
            <div className="cta-btns">
              <button id="cta-try-btn" className="btn-hero-main" onClick={() => navigate("/editor")}>Enter the Editor</button>
              <button id="cta-signup-btn" className="btn-hero-outline" onClick={() => navigate("/signup")}>Create Free Account</button>
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

