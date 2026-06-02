import { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import toast, { Toaster } from "react-hot-toast";
import { reviewCode, runCode, chatWithAI } from "../services/api";

const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block; flex-shrink: 0;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.chat-msg { animation: fadeIn 0.25s ease; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
.dot1 { animation: bounce 1.2s infinite ease-in-out; animation-delay: 0s; }
.dot2 { animation: bounce 1.2s infinite ease-in-out; animation-delay: 0.2s; }
.dot3 { animation: bounce 1.2s infinite ease-in-out; animation-delay: 0.4s; }
@keyframes timerPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.timer-warning { animation: timerPulse 1s infinite; }
.shortcut-badge {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
}
`;

const QUICK_PROMPTS = [
  "Explain this code", "Find bugs", "Optimize it",
  "Add comments", "Convert to Python", "Time complexity?",
];

const TIMER_OPTIONS = [
  { label: "30 min", seconds: 1800 },
  { label: "45 min", seconds: 2700 },
  { label: "60 min", seconds: 3600 },
  { label: "90 min", seconds: 5400 },
];

function CodeEditor() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(`#include<iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b;
    return 0;
}`);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [stats, setStats] = useState(null);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "👋 Hi! I can help you understand, debug, or optimize your code. Ask me anything or pick a quick prompt!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Multiple test cases
  const [testCases, setTestCases] = useState([
    { id: 1, input: "10 20", expectedOutput: "30", actualOutput: "", status: "idle" },
    { id: 2, input: "", expectedOutput: "", actualOutput: "", status: "idle" },
  ]);
  const [testMode, setTestMode] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // Interview timer
  const [timerMode, setTimerMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1800);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLeft, setTimerLeft] = useState(1800);
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const timerRef = useRef(null);

  // Shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  // Timer countdown
  useEffect(() => {
    if (timerRunning && timerLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimerLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            toast.error("⏰ Time's up! Interview ended.", { duration: 5000 });
            return 0;
          }
          if (prev === 300) toast("⚠️ 5 minutes remaining!", { icon: "⏰" });
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  // Keyboard shortcuts
  const handleKeyboard = useCallback((e) => {
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleRun(); }
    if (e.ctrlKey && e.shiftKey && e.key === "R") { e.preventDefault(); handleReview(); }
    if (e.ctrlKey && e.shiftKey && e.key === "C") { e.preventDefault(); setChatOpen((o) => !o); }
    if (e.key === "?" && !e.ctrlKey && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      setShowShortcuts((s) => !s);
    }
    if (e.key === "Escape") { setShowShortcuts(false); setShowTimerSetup(false); }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  const languageMap = { cpp: 54, python: 71, java: 62, javascript: 63 };

  const templates = {
    cpp: `#include<iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b;
    return 0;
}`,
    python: `a, b = map(int, input().split())
print(a + b)`,
    java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`,
    javascript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(" ");
const a = Number(input[0]);
const b = Number(input[1]);
console.log(a + b);`,
  };

  const t = darkMode
    ? {
        bg: "#020617", surface: "#0f172a", card: "#1e293b", border: "#334155",
        text: "#f1f5f9", muted: "#94a3b8", pre: "#020617", preText: "#cbd5e1",
        editorTheme: "vs-dark", selectBg: "#1e293b", btnCopy: "#475569",
        btnReview: "#4f46e5", btnRun: "#16a34a", toggleBg: "#1e293b",
        toggleText: "#facc15", statBg: "#1e293b",
        chatBg: "#0f172a", chatSurface: "#1e293b", chatUser: "#4f46e5",
        chatAI: "#1e293b", chatBorder: "#334155",
        modalBg: "#0f172a",
      }
    : {
        bg: "#f1f5f9", surface: "#ffffff", card: "#e2e8f0", border: "#cbd5e1",
        text: "#0f172a", muted: "#64748b", pre: "#f8fafc", preText: "#1e293b",
        editorTheme: "vs-light", selectBg: "#e2e8f0", btnCopy: "#64748b",
        btnReview: "#4f46e5", btnRun: "#16a34a", toggleBg: "#e2e8f0",
        toggleText: "#1d4ed8", statBg: "#e2e8f0",
        chatBg: "#ffffff", chatSurface: "#f1f5f9", chatUser: "#4f46e5",
        chatAI: "#e2e8f0", chatBorder: "#cbd5e1",
        modalBg: "#ffffff",
      };

  const statusColor = (s) => {
    if (!s || s === "idle") return t.muted;
    if (s === "Accepted" || s === "pass") return "#22c55e";
    if (s === "fail" || s?.includes("Error") || s?.includes("Wrong")) return "#ef4444";
    return "#f59e0b";
  };

  const formatTimer = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setCode(templates[e.target.value]);
    setStats(null);
    setOutput("");
  };

  const handleRun = async () => {
    try {
      setLoading(true);
      setStats(null);
      setOutput("");
      const data = await runCode(code, language, languageMap[language], stdin);
      setOutput(data.stdout || data.stderr || data.compile_output || "No Output");
      setStats({
        time: data.time ? `${data.time}s` : "N/A",
        memory: data.memory ? `${data.memory} KB` : "N/A",
        status: data.status?.description || "Unknown",
      });
      toast.success("Code Executed Successfully");
    } catch (err) {
      console.error(err);
      toast.error("Execution Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      setLoading(true);
      const data = await reviewCode(code, language);
      setReview(data.review);
      toast.success("AI Review Generated");
    } catch (err) {
      console.error(err);
      toast.error("Review Failed");
    } finally {
      setLoading(false);
    }
  };

  // Run all test cases
  const handleRunAllTests = async () => {
    setTestLoading(true);
    const updated = [...testCases];
    for (let i = 0; i < updated.length; i++) {
      const tc = updated[i];
      if (!tc.input && !tc.expectedOutput) continue;
      try {
        updated[i] = { ...tc, status: "running" };
        setTestCases([...updated]);
        const data = await runCode(code, language, languageMap[language], tc.input);
        const actual = (data.stdout || data.stderr || data.compile_output || "").trim();
        const expected = tc.expectedOutput.trim();
        updated[i] = {
          ...tc,
          actualOutput: actual,
          status: actual === expected ? "pass" : expected === "" ? "ran" : "fail",
        };
        setTestCases([...updated]);
      } catch {
        updated[i] = { ...tc, actualOutput: "Error", status: "fail" };
        setTestCases([...updated]);
      }
    }
    setTestLoading(false);
    const passed = updated.filter((tc) => tc.status === "pass").length;
    const total = updated.filter((tc) => tc.input || tc.expectedOutput).length;
    toast.success(`Test Results: ${passed}/${total} passed`);
  };

  const addTestCase = () => {
    setTestCases((prev) => [...prev, { id: Date.now(), input: "", expectedOutput: "", actualOutput: "", status: "idle" }]);
  };

  const removeTestCase = (id) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const updateTestCase = (id, field, value) => {
    setTestCases((prev) => prev.map((tc) => tc.id === id ? { ...tc, [field]: value, status: "idle" } : tc));
  };

  const sendChat = async (question) => {
    const q = question || chatInput.trim();
    if (!q) return;
    setChatMessages((prev) => [...prev, { role: "user", text: q }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const data = await chatWithAI(q, code, language);
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "❌ Error getting response. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} Copied`);
  };

  const btn = (bg) => ({
    background: bg, color: "white", border: "none", padding: "11px 22px",
    borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer",
    fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center",
    gap: "8px", opacity: loading ? 0.75 : 1, transition: "opacity 0.2s",
  });

  const smallBtn = {
    background: t.card, color: t.text, border: `1px solid ${t.border}`,
    padding: "6px 13px", borderRadius: "8px", cursor: "pointer", fontSize: "13px",
  };

  const tcStatusIcon = (s) => {
    if (s === "pass") return "✅";
    if (s === "fail") return "❌";
    if (s === "running") return "⏳";
    if (s === "ran") return "▶";
    return "○";
  };

  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.text, padding: "30px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", transition: "background 0.3s, color 0.3s", boxSizing: "border-box" }}>
      <style>{spinnerStyle}</style>
      <Toaster />

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowShortcuts(false)}>
          <div style={{ background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "28px", minWidth: "340px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", fontSize: "18px" }}>⌨️ Keyboard Shortcuts</h2>
            {[
              ["Ctrl + Enter", "Run Code"],
              ["Ctrl + Shift + R", "Review Code"],
              ["Ctrl + Shift + C", "Toggle AI Chat"],
              ["?", "Show/Hide Shortcuts"],
              ["Esc", "Close modals"],
            ].map(([key, desc]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ color: t.muted, fontSize: "14px" }}>{desc}</span>
                <span style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontFamily: "monospace" }}>{key}</span>
              </div>
            ))}
            <button onClick={() => setShowShortcuts(false)} style={{ ...smallBtn, marginTop: "20px", width: "100%", textAlign: "center", padding: "10px" }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Timer Setup Modal */}
      {showTimerSetup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowTimerSetup(false)}>
          <div style={{ background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "28px", minWidth: "320px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", fontSize: "18px" }}>⏱ Interview Timer</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {TIMER_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => { setTimerSeconds(opt.seconds); setTimerLeft(opt.seconds); }}
                  style={{ background: timerSeconds === opt.seconds ? "#4f46e5" : t.card, color: timerSeconds === opt.seconds ? "white" : t.text, border: `1px solid ${timerSeconds === opt.seconds ? "#4f46e5" : t.border}`, borderRadius: "10px", padding: "12px", cursor: "pointer", fontWeight: "600", fontSize: "15px" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setTimerMode(true); setTimerRunning(true); setTimerLeft(timerSeconds); setShowTimerSetup(false); toast.success("⏱ Interview timer started!"); }}
              style={{ background: "#16a34a", color: "white", border: "none", borderRadius: "10px", padding: "12px", width: "100%", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}
            >
              ▶ Start Timer
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "40px", fontWeight: "800", margin: 0, letterSpacing: "-1px", background: "linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CodeReview AI
          </h1>
          <p style={{ color: t.muted, margin: "6px 0 0", fontSize: "15px" }}>
            AI-powered code review &amp; execution platform
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>

          {/* Timer display */}
          {timerMode && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: timerLeft < 300 ? "rgba(239,68,68,0.15)" : t.card, border: `1px solid ${timerLeft < 300 ? "#ef4444" : t.border}`, borderRadius: "12px", padding: "10px 16px" }}>
              <span className={timerLeft < 300 ? "timer-warning" : ""} style={{ fontSize: "20px", fontWeight: "800", color: timerLeft < 300 ? "#ef4444" : "#22c55e", letterSpacing: "2px" }}>
                {formatTimer(timerLeft)}
              </span>
              <button onClick={() => setTimerRunning((r) => !r)} style={{ ...smallBtn, padding: "4px 8px", fontSize: "12px" }}>
                {timerRunning ? "⏸" : "▶"}
              </button>
              <button onClick={() => { setTimerMode(false); setTimerRunning(false); clearInterval(timerRef.current); }} style={{ ...smallBtn, padding: "4px 8px", fontSize: "12px" }}>
                ✕
              </button>
            </div>
          )}

          <button onClick={() => setShowTimerSetup(true)} style={{ background: t.toggleBg, color: t.text, border: `1px solid ${t.border}`, padding: "10px 16px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            ⏱ Timer
          </button>
          <button onClick={() => setShowShortcuts(true)} style={{ background: t.toggleBg, color: t.text, border: `1px solid ${t.border}`, padding: "10px 16px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            ⌨️ ?
          </button>
          <button onClick={() => setChatOpen(!chatOpen)} style={{ background: chatOpen ? "#4f46e5" : t.toggleBg, color: chatOpen ? "white" : t.text, border: `1px solid ${chatOpen ? "#4f46e5" : t.border}`, padding: "10px 16px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
            💬 Chat {chatOpen ? "▲" : "▼"}
          </button>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: t.toggleBg, color: t.toggleText, border: `1px solid ${t.border}`, padding: "10px 16px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

        {/* Left: editor column */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Controls row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
            <select value={language} onChange={handleLanguageChange} style={{ background: t.selectBg, color: t.text, padding: "11px 16px", borderRadius: "10px", border: `1px solid ${t.border}`, fontSize: "15px", cursor: "pointer" }}>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={() => copy(code, "Code")} style={{ ...btn(t.btnCopy) }}>📋 Copy</button>
              <button onClick={() => setTestMode((m) => !m)} style={{ background: testMode ? "#0e7490" : t.card, color: testMode ? "white" : t.text, border: `1px solid ${testMode ? "#0e7490" : t.border}`, padding: "11px 18px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                🧪 Tests {testMode ? "▲" : "▼"}
              </button>
              <button onClick={handleReview} disabled={loading} style={btn(t.btnReview)}>
                {loading ? <><span className="spinner" /> Reviewing…</> : "🔍 Review"}
              </button>
              <button onClick={handleRun} disabled={loading} style={btn(t.btnRun)}>
                {loading ? <><span className="spinner" /> Running…</> : "▶ Run"}
              </button>
            </div>
          </div>

          {/* Custom Input (only when test mode off) */}
          {!testMode && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "13px", color: t.muted, fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                📥 Custom Input <span style={{ fontSize: "11px", marginLeft: "8px", opacity: 0.6 }}>Ctrl+Enter to run</span>
              </h3>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input here…  e.g.  10 20"
                style={{ width: "100%", height: "80px", background: t.surface, color: t.text, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "14px", fontSize: "14px", resize: "none", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
              />
            </div>
          )}

          {/* Test Cases Panel */}
          {testMode && (
            <div style={{ marginBottom: "20px", background: t.surface, borderRadius: "14px", border: `1px solid ${t.border}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>🧪 Test Cases</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={addTestCase} style={{ ...smallBtn, background: "#1e293b", color: "#22d3ee", borderColor: "#22d3ee", fontSize: "13px" }}>+ Add Case</button>
                  <button
                    onClick={handleRunAllTests}
                    disabled={testLoading}
                    style={{ background: "#16a34a", color: "white", border: "none", borderRadius: "8px", padding: "6px 16px", cursor: testLoading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", opacity: testLoading ? 0.7 : 1 }}
                  >
                    {testLoading ? <><span className="spinner" style={{ width: "12px", height: "12px" }} /> Running…</> : "▶ Run All"}
                  </button>
                </div>
              </div>

              {/* Stats bar */}
              {testCases.some((tc) => tc.status !== "idle") && (
                <div style={{ padding: "10px 18px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: "16px", fontSize: "13px" }}>
                  <span style={{ color: "#22c55e" }}>✅ {testCases.filter((tc) => tc.status === "pass").length} Passed</span>
                  <span style={{ color: "#ef4444" }}>❌ {testCases.filter((tc) => tc.status === "fail").length} Failed</span>
                  <span style={{ color: t.muted }}>Total: {testCases.filter((tc) => tc.input || tc.expectedOutput).length}</span>
                </div>
              )}

              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "320px", overflowY: "auto" }}>
                {testCases.map((tc, idx) => (
                  <div key={tc.id} style={{ background: t.card, borderRadius: "10px", padding: "14px", border: `1px solid ${tc.status === "pass" ? "#22c55e44" : tc.status === "fail" ? "#ef444444" : t.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                        {tcStatusIcon(tc.status)} Case {idx + 1}
                        {tc.status === "pass" && <span style={{ color: "#22c55e", fontSize: "12px" }}>Passed</span>}
                        {tc.status === "fail" && <span style={{ color: "#ef4444", fontSize: "12px" }}>Failed</span>}
                      </span>
                      <button onClick={() => removeTestCase(tc.id)} style={{ background: "none", border: "none", color: t.muted, cursor: "pointer", fontSize: "16px" }}>✕</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: t.muted, marginBottom: "4px", textTransform: "uppercase" }}>Input</div>
                        <textarea
                          value={tc.input}
                          onChange={(e) => updateTestCase(tc.id, "input", e.target.value)}
                          placeholder="e.g. 10 20"
                          style={{ width: "100%", height: "60px", background: t.pre, color: t.preText, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "8px", fontSize: "13px", resize: "none", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: t.muted, marginBottom: "4px", textTransform: "uppercase" }}>Expected Output</div>
                        <textarea
                          value={tc.expectedOutput}
                          onChange={(e) => updateTestCase(tc.id, "expectedOutput", e.target.value)}
                          placeholder="e.g. 30"
                          style={{ width: "100%", height: "60px", background: t.pre, color: t.preText, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "8px", fontSize: "13px", resize: "none", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>
                    </div>
                    {tc.actualOutput && (
                      <div style={{ marginTop: "8px", fontSize: "12px" }}>
                        <span style={{ color: t.muted }}>Actual: </span>
                        <span style={{ color: tc.status === "pass" ? "#22c55e" : "#ef4444", fontWeight: "600" }}>{tc.actualOutput}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monaco Editor */}
          <div style={{ borderRadius: "14px", overflow: "hidden", border: `1px solid ${t.border}`, opacity: loading ? 0.55 : 1, pointerEvents: loading ? "none" : "auto", transition: "opacity 0.25s" }}>
            <Editor
              height="440px"
              theme={t.editorTheme}
              language={language}
              value={code}
              onChange={(v) => setCode(v)}
              options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }}
            />
          </div>

          {/* Output + Review grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px" }}>
            {/* Output panel */}
            <div style={{ background: t.surface, borderRadius: "14px", padding: "20px", border: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "16px" }}>⚡ Output</h2>
                <button onClick={() => copy(output, "Output")} style={smallBtn}>Copy</button>
              </div>
              {stats && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span style={{ background: t.statBg, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", color: t.muted }}>
                    ⏱ <strong style={{ color: t.text }}>{stats.time}</strong>
                  </span>
                  <span style={{ background: t.statBg, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", color: t.muted }}>
                    💾 <strong style={{ color: t.text }}>{stats.memory}</strong>
                  </span>
                  <span style={{ background: t.statBg, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", color: t.muted }}>
                    ✅ <strong style={{ color: statusColor(stats.status) }}>{stats.status}</strong>
                  </span>
                </div>
              )}
              <pre style={{ background: t.pre, padding: "14px", borderRadius: "10px", minHeight: "160px", color: t.preText, whiteSpace: "pre-wrap", margin: 0, fontSize: "14px", fontFamily: "inherit" }}>
                {loading
                  ? <span style={{ color: t.muted, display: "flex", alignItems: "center", gap: "10px" }}><span className="spinner" style={{ borderTopColor: "#6366f1", borderColor: "rgba(99,102,241,0.3)" }} /> Executing…</span>
                  : (output || "Output will appear here…")}
              </pre>
            </div>

            {/* AI Review panel */}
            <div style={{ background: t.surface, borderRadius: "14px", padding: "20px", border: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "16px" }}>🤖 AI Review</h2>
                <button onClick={() => copy(review, "Review")} style={smallBtn}>Copy</button>
              </div>
              <div style={{ background: t.pre, padding: "16px", borderRadius: "10px", minHeight: "200px", color: t.preText, overflowX: "auto", lineHeight: "1.8", fontSize: "14px" }}>
                {loading
                  ? <span style={{ color: t.muted, display: "flex", alignItems: "center", gap: "10px" }}><span className="spinner" style={{ borderTopColor: "#4f46e5", borderColor: "rgba(79,70,229,0.3)" }} /> Generating review…</span>
                  : <ReactMarkdown>{review || "AI review will appear here…"}</ReactMarkdown>}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Chat panel */}
        {chatOpen && (
          <div style={{ width: "360px", flexShrink: 0, background: t.chatBg, borderRadius: "16px", border: `1px solid ${t.chatBorder}`, display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", position: "sticky", top: "20px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.chatBorder}`, background: t.chatSurface, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "15px" }}>💬 AI Chat Assistant</div>
                <div style={{ fontSize: "12px", color: t.muted, marginTop: "2px" }}>Ask about your {language} code</div>
              </div>
              <button onClick={() => setChatMessages([{ role: "assistant", text: "👋 Chat cleared! Ask me anything about your code." }])} style={{ ...smallBtn, fontSize: "12px", padding: "4px 10px" }}>Clear</button>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.chatBorder}`, display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendChat(p)} disabled={chatLoading} style={{ background: t.card, color: t.text, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "4px 12px", fontSize: "12px", cursor: chatLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap", opacity: chatLoading ? 0.6 : 1 }}>
                  {p}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} className="chat-msg" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "88%", background: msg.role === "user" ? t.chatUser : t.chatAI, color: msg.role === "user" ? "white" : t.text, borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 14px", fontSize: "13px", lineHeight: "1.7", border: msg.role === "assistant" ? `1px solid ${t.chatBorder}` : "none" }}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg" style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: t.chatAI, border: `1px solid ${t.chatBorder}`, borderRadius: "14px 14px 14px 4px", padding: "14px 18px", display: "flex", gap: "5px", alignItems: "center" }}>
                    <span className="dot1" style={{ width: "8px", height: "8px", background: t.muted, borderRadius: "50%", display: "inline-block" }} />
                    <span className="dot2" style={{ width: "8px", height: "8px", background: t.muted, borderRadius: "50%", display: "inline-block" }} />
                    <span className="dot3" style={{ width: "8px", height: "8px", background: t.muted, borderRadius: "50%", display: "inline-block" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "14px", borderTop: `1px solid ${t.chatBorder}`, display: "flex", gap: "8px", background: t.chatSurface }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Ask about your code…"
                disabled={chatLoading}
                style={{ flex: 1, background: t.chatBg, color: t.text, border: `1px solid ${t.chatBorder}`, borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "inherit", outline: "none", opacity: chatLoading ? 0.7 : 1 }}
              />
              <button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()} style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", fontSize: "18px", opacity: chatLoading || !chatInput.trim() ? 0.6 : 1 }}>
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeEditor;
