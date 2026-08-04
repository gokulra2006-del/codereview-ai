import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─── Star / Particle canvas ────────────────────────────────────────────────
function StarCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random(), da: (Math.random() * 0.015 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
    }));
    const orbs = Array.from({ length: 18 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 3 + 1,
      c: Math.random() > 0.5 ? "#6366f1" : "#22d3ee",
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.a += s.da; if (s.a > 1) { s.a = 1; s.da *= -1; } if (s.a < 0.05) { s.a = 0.05; s.da *= -1; }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`; ctx.fill();
      });
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < 0) o.x = canvas.width; if (o.x > canvas.width) o.x = 0;
        if (o.y < 0) o.y = canvas.height; if (o.y > canvas.height) o.y = 0;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 4);
        g.addColorStop(0, o.c + "aa"); g.addColorStop(1, o.c + "00");
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = o.c; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

// ─── Data ──────────────────────────────────────────────────────────────────
const TECH = [
  { icon: "⚛️", name: "React" },
  { icon: "⚡", name: "Vite" },
  { icon: "🟩", name: "Node.js" },
  { icon: "🚂", name: "Express" },
  { icon: "🎨", name: "CSS3" },
  { icon: "🗃️", name: "REST APIs" },
  { icon: "🤖", name: "AI / LLMs" },
  { icon: "🔐", name: "JWT Auth" },
  { icon: "🌐", name: "JavaScript" },
  { icon: "📦", name: "Monaco Editor" },
];

const PROJECTS = [
  {
    emoji: "🌌",
    name: "CodeReview AI",
    desc: "A full-stack AI-powered code review and execution platform. Features real-time code execution, LLM-based review, multi-test mode, interview timer with 3 difficulty modes, guest access with rate limiting, and JWT authentication.",
    tags: ["React", "Node.js", "AI", "Monaco", "JWT"],
    color: "#6366f1",
    link: "/editor",
    badge: "Current Project",
  },
];

const FACTS = [
  { icon: "🎯", label: "Role", value: "Full-Stack Designer & Developer" },
  { icon: "🌍", label: "Location", value: "India" },
  { icon: "💡", label: "Passion", value: "Building beautiful, functional products" },
  { icon: "🚀", label: "Currently", value: "Building AI-powered dev tools" },
];

// ─── Styles ────────────────────────────────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #010409; overflow-x: hidden; }

  .dp {
    min-height: 100vh;
    background: #010409;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
    position: relative;
    overflow-x: hidden;
  }

  /* Nebula blobs */
  .dp-neb1 { position: fixed; top: -200px; left: -150px; width: 650px; height: 650px; background: radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%); border-radius: 50%; pointer-events: none; z-index: 0; animation: dpFloat 16s ease-in-out infinite alternate; }
  .dp-neb2 { position: fixed; bottom: -200px; right: -150px; width: 700px; height: 700px; background: radial-gradient(ellipse, rgba(34,211,238,0.08) 0%, transparent 70%); border-radius: 50%; pointer-events: none; z-index: 0; animation: dpFloat 20s ease-in-out infinite alternate-reverse; }
  @keyframes dpFloat { from { transform: scale(1) translate(0,0); } to { transform: scale(1.1) translate(2%,4%); } }

  /* Navbar */
  .dp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 56px;
    background: rgba(1,4,9,0.8); backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(99,102,241,0.12);
  }
  .dp-nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; }
  .dp-nav-logo-icon {
    width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #22d3ee);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 900; color: white;
    animation: logoFloat 3s ease-in-out infinite;
  }
  @keyframes logoFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .dp-nav-logo-text {
    font-size: 16px; font-weight: 800;
    background: linear-gradient(135deg, #818cf8, #22d3ee);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .dp-back-btn {
    background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3);
    color: #a5b4fc; padding: 8px 20px; border-radius: 10px; cursor: pointer;
    font-size: 13px; font-family: inherit; font-weight: 600;
    transition: all 0.25s; display: flex; align-items: center; gap: 6px;
  }
  .dp-back-btn:hover { background: rgba(99,102,241,0.2); color: #c4b5fd; }

  /* Hero section */
  .dp-hero {
    position: relative; z-index: 1;
    padding: 140px 24px 80px;
    text-align: center;
    display: flex; flex-direction: column; align-items: center;
  }

  /* Glowing avatar */
  .dp-avatar-wrap {
    position: relative;
    margin-bottom: 40px;
  }
  .dp-avatar-ring {
    position: absolute; inset: -16px;
    border-radius: 50%;
    border: 2px dashed rgba(99,102,241,0.3);
    animation: ringRotate 12s linear infinite;
  }
  .dp-avatar-ring2 {
    position: absolute; inset: -30px;
    border-radius: 50%;
    border: 1px solid rgba(34,211,238,0.15);
    animation: ringRotate 22s linear infinite reverse;
  }
  @keyframes ringRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .dp-avatar {
    width: 140px; height: 140px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e40af 70%, #0e7490 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 56px; font-weight: 900;
    box-shadow:
      0 0 0 3px rgba(99,102,241,0.4),
      0 0 40px rgba(99,102,241,0.35),
      0 0 80px rgba(99,102,241,0.15);
    animation: avatarFloat 4s ease-in-out infinite;
    position: relative; z-index: 1;
    color: white;
    letter-spacing: -2px;
  }
  @keyframes avatarFloat {
    0%,100% { transform: translateY(0px); box-shadow: 0 0 0 3px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.35), 0 0 80px rgba(99,102,241,0.15); }
    50% { transform: translateY(-14px); box-shadow: 0 16px 60px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.4), 0 0 120px rgba(34,211,238,0.2); }
  }

  /* Live dot */
  .dp-live {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3);
    border-radius: 999px; padding: 6px 16px; margin-bottom: 24px;
    font-size: 12px; color: #4ade80; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .dp-live-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #4ade80;
    box-shadow: 0 0 8px #4ade80;
    animation: livePulse 1.8s ease-in-out infinite;
  }
  @keyframes livePulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.7); opacity: 0.4; } }

  /* Name */
  .dp-name {
    font-size: clamp(56px, 9vw, 100px);
    font-weight: 900;
    letter-spacing: -4px;
    line-height: 1;
    background: linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 25%, #818cf8 50%, #6366f1 70%, #22d3ee 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    margin-bottom: 16px;
    animation: fadeUp 0.6s ease both;
  }
  .dp-role {
    font-size: clamp(14px, 2vw, 18px);
    color: #64748b; margin-bottom: 10px;
    animation: fadeUp 0.7s 0.1s ease both;
  }
  .dp-role em { color: #94a3b8; font-style: normal; }
  .dp-tagline {
    font-size: 13px; color: #334155;
    margin-bottom: 44px; line-height: 1.7;
    animation: fadeUp 0.8s 0.2s ease both;
  }

  /* Divider */
  .dp-divider {
    width: 80px; height: 2px;
    background: linear-gradient(90deg, transparent, #6366f1, #22d3ee, transparent);
    border-radius: 2px; margin: 0 auto 64px;
  }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  /* Sections */
  .dp-section { position: relative; z-index: 1; padding: 0 24px 80px; }
  .dp-inner { max-width: 960px; margin: 0 auto; }
  .dp-section-label {
    font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.12em;
    display: flex; align-items: center; gap: 10px; margin-bottom: 32px;
  }
  .dp-section-label::after { content: ''; flex: 1; height: 1px; background: rgba(99,102,241,0.15); }
  .dp-section-label::before { content: ''; flex: 1; height: 1px; background: rgba(99,102,241,0.15); }
  .dp-section-label span { white-space: nowrap; }

  /* Facts grid */
  .dp-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 0; }
  .dp-fact {
    background: linear-gradient(145deg, #0d1117, #0f172a);
    border: 1px solid rgba(99,102,241,0.1);
    border-radius: 16px; padding: 22px 24px;
    transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s, border-color 0.35s;
  }
  .dp-fact:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.25); }
  .dp-fact-icon { font-size: 22px; margin-bottom: 10px; }
  .dp-fact-label { font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .dp-fact-val { font-size: 13px; color: #e2e8f0; font-weight: 600; line-height: 1.5; }

  /* Tech stack */
  .dp-tech { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
  .dp-tech-chip {
    display: flex; align-items: center; gap: 8px;
    background: linear-gradient(145deg, #0d1117, #0f172a);
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: 12px; padding: 12px 20px;
    font-size: 13px; font-weight: 600; color: #94a3b8;
    transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
    cursor: default;
  }
  .dp-tech-chip:hover {
    transform: translateY(-4px) scale(1.04);
    box-shadow: 0 10px 30px rgba(99,102,241,0.2);
    border-color: rgba(99,102,241,0.3); color: #c4b5fd;
  }
  .dp-tech-chip span:first-child { font-size: 18px; }

  /* Project card */
  .dp-project {
    background: linear-gradient(145deg, #0d1117, #0f172a);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 24px; padding: 40px;
    position: relative; overflow: hidden;
    transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
  }
  .dp-project::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(34,211,238,0.5), transparent);
  }
  .dp-project:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 60px rgba(99,102,241,0.18), 0 8px 24px rgba(0,0,0,0.4);
    border-color: rgba(99,102,241,0.3);
  }
  .dp-proj-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
  .dp-proj-badge {
    background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
    border-radius: 999px; padding: 4px 14px; font-size: 11px; color: #818cf8;
    text-transform: uppercase; letter-spacing: 0.08em; align-self: flex-start;
  }
  .dp-proj-emoji { font-size: 40px; }
  .dp-proj-name { font-size: 24px; font-weight: 900; color: #f1f5f9; margin-bottom: 12px; letter-spacing: -0.5px; }
  .dp-proj-desc { font-size: 14px; color: #475569; line-height: 1.8; margin-bottom: 24px; }
  .dp-proj-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
  .dp-proj-tag {
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.18);
    border-radius: 8px; padding: 4px 12px; font-size: 12px; color: #818cf8;
  }
  .dp-proj-btn {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; border: none; border-radius: 12px; padding: 13px 32px;
    cursor: pointer; font-size: 14px; font-weight: 800; font-family: inherit;
    box-shadow: 0 4px 20px rgba(99,102,241,0.4);
    transition: all 0.25s; display: inline-flex; align-items: center; gap: 8px;
  }
  .dp-proj-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.55); }

  /* Philosophy quote */
  .dp-quote {
    background: linear-gradient(145deg, rgba(99,102,241,0.06), rgba(34,211,238,0.04));
    border: 1px solid rgba(99,102,241,0.15);
    border-left: 3px solid #6366f1;
    border-radius: 0 16px 16px 0;
    padding: 28px 32px;
    font-size: 18px; font-weight: 700; line-height: 1.7;
    color: #94a3b8;
    font-style: italic;
    position: relative;
  }
  .dp-quote strong { color: #e2e8f0; font-style: normal; }
  .dp-quote::before { content: '"'; font-size: 80px; color: rgba(99,102,241,0.15); position: absolute; top: -10px; left: 20px; line-height: 1; font-family: Georgia, serif; font-style: normal; }
  .dp-quote-attr { margin-top: 14px; font-size: 13px; font-style: normal; color: #4f46e5; font-weight: 700; }

  /* Signature section */
  .dp-sig {
    text-align: center; padding: 60px 24px 40px;
    position: relative; z-index: 1;
  }
  .dp-sig-name {
    font-size: clamp(32px, 6vw, 64px);
    font-weight: 900; letter-spacing: -2px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #22d3ee);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    margin-bottom: 8px;
  }
  .dp-sig-sub { font-size: 13px; color: #334155; }

  /* Footer */
  .dp-footer {
    position: relative; z-index: 1;
    border-top: 1px solid rgba(99,102,241,0.1);
    padding: 28px 56px;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 16px;
    background: rgba(1,4,9,0.8); backdrop-filter: blur(12px);
  }
  .dp-footer-left { font-size: 12px; color: #1e293b; }
  .dp-footer-right { font-size: 12px; color: #334155; }

  @media (max-width: 768px) {
    .dp-nav { padding: 14px 20px; }
    .dp-hero { padding: 120px 20px 60px; }
    .dp-footer { flex-direction: column; text-align: center; padding: 24px 20px; }
    .dp-project { padding: 28px 20px; }
  }
`;

export default function DesignerPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "GOKUL R — Designer & Developer";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="dp">
      <style>{S}</style>
      <StarCanvas />
      <div className="dp-neb1" />
      <div className="dp-neb2" />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="dp-nav">
        <div className="dp-nav-logo" onClick={() => navigate("/")}>
          <div className="dp-nav-logo-icon">&lt;/&gt;</div>
          <span className="dp-nav-logo-text">CodeReview AI</span>
        </div>
        <button className="dp-back-btn" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="dp-hero">
        {/* Floating avatar */}
        <div className="dp-avatar-wrap">
          <div className="dp-avatar-ring" />
          <div className="dp-avatar-ring2" />
          <div className="dp-avatar">GR</div>
        </div>

        {/* Live badge */}
        <div className="dp-live">
          <div className="dp-live-dot" />
          Available for opportunities
        </div>

        <h1 className="dp-name">GOKUL R</h1>
        <p className="dp-role">
          <em>Full-Stack Designer &amp; Developer</em>
        </p>
        <p className="dp-tagline">
          Crafting AI-powered products that live at the intersection of<br />
          beautiful design, performant code, and real-world impact.
        </p>

        <div className="dp-divider" />
      </section>

      {/* ── About ──────────────────────────────────────────────────────────── */}
      <section className="dp-section">
        <div className="dp-inner">
          <div className="dp-section-label"><span>✦ About</span></div>
          <div className="dp-facts">
            {FACTS.map((f) => (
              <div className="dp-fact" key={f.label}>
                <div className="dp-fact-icon">{f.icon}</div>
                <div className="dp-fact-label">{f.label}</div>
                <div className="dp-fact-val">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophy ─────────────────────────────────────────────────────── */}
      <section className="dp-section">
        <div className="dp-inner">
          <div className="dp-section-label"><span>✦ Philosophy</span></div>
          <div className="dp-quote">
            Good software should feel <strong>inevitable</strong> — like it could
            not have been designed any other way. Every pixel, every interaction,
            every line of code should serve a <strong>clear purpose</strong>.
            <div className="dp-quote-attr">— GOKUL R</div>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ─────────────────────────────────────────────────────── */}
      <section className="dp-section">
        <div className="dp-inner">
          <div className="dp-section-label"><span>✦ Tech Stack</span></div>
          <div className="dp-tech">
            {TECH.map((t) => (
              <div className="dp-tech-chip" key={t.name}>
                <span>{t.icon}</span>
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ───────────────────────────────────────────────────────── */}
      <section className="dp-section">
        <div className="dp-inner">
          <div className="dp-section-label"><span>✦ Featured Project</span></div>
          {PROJECTS.map((p) => (
            <div className="dp-project" key={p.name}>
              <div className="dp-proj-header">
                <div>
                  <div className="dp-proj-emoji">{p.emoji}</div>
                </div>
                <div className="dp-proj-badge">{p.badge}</div>
              </div>
              <div className="dp-proj-name">{p.name}</div>
              <p className="dp-proj-desc">{p.desc}</p>
              <div className="dp-proj-tags">
                {p.tags.map((tag) => (
                  <span className="dp-proj-tag" key={tag}>{tag}</span>
                ))}
              </div>
              <button className="dp-proj-btn" onClick={() => navigate(p.link)}>
                ⚡ Launch Editor →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Signature ──────────────────────────────────────────────────────── */}
      <section className="dp-sig">
        <div className="dp-sig-name">GOKUL R</div>
        <div className="dp-sig-sub">Designed &amp; Built with 🤍 from India</div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="dp-footer">
        <span className="dp-footer-left">© 2025 GOKUL R. All rights reserved.</span>
        <span className="dp-footer-right">
          Built with React · Vite · Node.js · AI
        </span>
      </footer>
    </div>
  );
}
