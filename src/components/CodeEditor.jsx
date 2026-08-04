import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import toast, { Toaster } from "react-hot-toast";
import { reviewCode, runCode, chatWithAI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Play, Search, MessageSquare, Clock, Moon, Sun,
  Settings, Copy, Check, X, AlertTriangle, Lock,
  ChevronRight, Terminal, User, LogOut, Code2,
  ShieldAlert, PlayCircle, Loader2, Pause, CheckCircle2, XCircle, Send, Server
} from "lucide-react";

// ─── Guest usage helpers (localStorage, resets every 24h) ────────────────────
const GUEST_LIMIT = 3;
const GUEST_KEY_REVIEW = "cr_guest_reviews";
const GUEST_KEY_RUN = "cr_guest_runs";
const GUEST_KEY_DATE = "cr_guest_date";

const getTodayStr = () => new Date().toDateString();

const getGuestCount = (key) => {
  const today = getTodayStr();
  if (localStorage.getItem(GUEST_KEY_DATE) !== today) {
    // New day → reset
    localStorage.setItem(GUEST_KEY_DATE, today);
    localStorage.setItem(GUEST_KEY_REVIEW, "0");
    localStorage.setItem(GUEST_KEY_RUN, "0");
  }
  return parseInt(localStorage.getItem(key) || "0", 10);
};

const incrementGuestCount = (key) => {
  const val = getGuestCount(key);
  localStorage.setItem(key, String(val + 1));
  return val + 1;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
.markdown-body pre {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin: 10px 0;
}
.markdown-body code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  background: rgba(0, 0, 0, 0.15);
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 12.5px;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
}
.markdown-body p:last-child { margin-bottom: 0; }
.markdown-body p:first-child { margin-top: 0; }
.markdown-body ul, .markdown-body ol { padding-left: 20px; }

@keyframes bannerSlide {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.guest-banner { animation: bannerSlide 0.4s ease forwards; }
.interview-bar { animation: bannerSlide 0.4s ease forwards; }

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.limit-modal { animation: modalIn 0.3s ease forwards; }

@keyframes lockPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.lock-pulse { animation: lockPulse 2s ease-in-out infinite; }

/* Premium Toolbar Styles */
.pro-toolbar {
  background: rgba(20, 25, 35, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
.pro-btn {
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.pro-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.pro-btn:active {
  transform: translateY(1px);
}
.pro-select {
  background: rgba(0, 0, 0, 0.2);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg fill="none" height="20" stroke="%23e2e8f0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"/></svg>');
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 32px;
}
.pro-select:hover {
  border-color: rgba(255, 255, 255, 0.25);
  background-color: rgba(255, 255, 255, 0.05);
}
.pro-primary-btn {
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}
.pro-primary-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}
.pro-primary-btn:active {
  transform: translateY(0);
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

// ─── Interview Modes ─────────────────────────────────────────────────────────
const INTERVIEW_MODES = [
  {
    id: "low",
    label: "Low",
    emoji: <CheckCircle2 size={18} />,
    title: "Practice",
    desc: "AI Review: Yes  ·  AI Chat: Yes",
    longDesc: "Full AI assistance — perfect for learning and practice sessions.",
    color: "#22c55e",
    border: "rgba(34,197,94,0.35)",
    bg: "rgba(34,197,94,0.08)",
    blockReview: false,
    blockChat: false,
  },
  {
    id: "med",
    label: "Med",
    emoji: <ShieldAlert size={18} />,
    title: "Challenge",
    desc: "AI Review: Yes  ·  AI Chat: No",
    longDesc: "Review allowed but chat is off — simulate assisted interview prep.",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.35)",
    bg: "rgba(245,158,11,0.08)",
    blockReview: false,
    blockChat: true,
  },
  {
    id: "strict",
    label: "Strict",
    emoji: <XCircle size={18} />,
    title: "Real Interview",
    desc: "AI Review: No  ·  AI Chat: No",
    longDesc: "No AI assistance at all — exactly like a real coding interview.",
    color: "#ef4444",
    border: "rgba(239,68,68,0.35)",
    bg: "rgba(239,68,68,0.08)",
    blockReview: true,
    blockChat: true,
  },
];

function CodeEditor() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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

  // Pro DX features
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const editorRef = useRef(null);

  const TEMPLATES = {
    javascript: `// React / Node.js Template\nconsole.log("Hello, World!");\n\nfunction calculate(a, b) {\n  return a + b;\n}\n\nconsole.log("Result:", calculate(10, 20));`,
    python: `# Python Script Template\ndef main():\n    print("Hello from Python")\n    a, b = 10, 20\n    print(f"Result: {a + b}")\n\nif __name__ == "__main__":\n    main()`,
    java: `// Java Main Class Template\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        int a = 10, b = 20;\n        System.out.println("Result: " + (a + b));\n    }\n}`,
    cpp: `// C++ Main Template\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++" << endl;\n    int a = 10, b = 20;\n    cout << "Result: " << (a + b) << endl;\n    return 0;\n}`
  };

  const handleTemplate = (e) => {
    const lang = e.target.value;
    if (!lang) return;
    setLanguage(lang);
    setCode(TEMPLATES[lang] || "");
    toast.success(`${lang} boilerplate loaded!`);
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
      toast.success("Code formatted");
    }
  };

  // Guest usage
  const [guestReviews, setGuestReviews] = useState(0);
  const [guestRuns, setGuestRuns] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitType, setLimitType] = useState("review");

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Hi! I can help you understand, debug, or optimize your code. Ask me anything or pick a quick prompt!" }
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
  const [interviewMode, setInterviewMode] = useState("low"); // "low" | "med" | "strict"
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const timerRef = useRef(null);

  // Derived interview mode config
  const activeModeConfig = INTERVIEW_MODES.find((m) => m.id === interviewMode);

  // Cancel timer fully
  const cancelTimer = () => {
    setTimerMode(false);
    setTimerRunning(false);
    clearInterval(timerRef.current);
    setShowCancelConfirm(false);
    toast("Interview cancelled.", { icon: <X size={16} />, duration: 3000 });
  };

  // Shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load guest usage on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setGuestReviews(getGuestCount(GUEST_KEY_REVIEW));
      setGuestRuns(getGuestCount(GUEST_KEY_RUN));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen, chatLoading]);

  // Timer countdown
  useEffect(() => {
    if (timerRunning && timerLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimerLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            toast.error("Time's up! Interview ended.", { duration: 5000 });
            return 0;
          }
          if (prev === 300) toast("5 minutes remaining!", { icon: <Clock size={16} /> });
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
    if (e.key === "Escape") { setShowShortcuts(false); setShowTimerSetup(false); setShowLimitModal(false); }
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

  // ─── Guest limit gate ────────────────────────────────────────────────────────
  const checkGuestLimit = (type) => {
    if (isAuthenticated) return true; // logged in → no limit
    const key = type === "review" ? GUEST_KEY_REVIEW : GUEST_KEY_RUN;
    const count = getGuestCount(key);
    if (count >= GUEST_LIMIT) {
      setLimitType(type);
      setShowLimitModal(true);
      return false;
    }
    return true;
  };

  const handleRun = async () => {
    if (!checkGuestLimit("run")) return;
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
      if (!isAuthenticated) {
        const newCount = incrementGuestCount(GUEST_KEY_RUN);
        setGuestRuns(newCount);
      }
    } catch (err) {
      console.error(err);
      toast.error("Execution Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    // Block in Strict interview mode
    if (timerMode && timerRunning && activeModeConfig.blockReview) {
      toast.error(`AI Review is disabled in ${activeModeConfig.title} mode.`, { duration: 3000 });
      return;
    }
    if (!checkGuestLimit("review")) return;
    try {
      setLoading(true);
      const data = await reviewCode(code, language);
      setReview(data.review);
      toast.success("AI Review Generated");
      if (!isAuthenticated) {
        const newCount = incrementGuestCount(GUEST_KEY_REVIEW);
        setGuestReviews(newCount);
      }
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
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Error getting response. Please try again." }]);
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
    if (s === "pass") return <Check size={14} />;
    if (s === "fail") return <X size={14} />;
    if (s === "running") return <Loader2 size={14} className="spinner" />;
    if (s === "ran") return <Play size={14} />;
    return <ChevronRight size={14} />;
  };

  return (
    <div style={{ background: t.bg, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", color: t.text, padding: "16px 24px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", transition: "background 0.3s, color 0.3s", boxSizing: "border-box" }}>
      <style>{spinnerStyle}</style>
      <Toaster />

      {/* ── Guest Limit Modal ──────────────────────────────────────────────────── */}
      {showLimitModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={() => setShowLimitModal(false)}
        >
          <div
            className="limit-modal"
            style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "20px", padding: "36px 32px", maxWidth: "420px", width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#6366f1" }}><Lock size={44} /></div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "12px", color: "#f1f5f9" }}>
              Daily Limit Reached
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.7", marginBottom: "28px" }}>
              You have used all <strong style={{ color: "#f1f5f9" }}>3 free {limitType}s</strong> for today.<br />
              Login to get <strong style={{ color: "#22d3ee" }}>unlimited</strong> access — it&apos;s free!
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => navigate("/login")}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", border: "none", borderRadius: "12px", padding: "12px 28px", cursor: "pointer", fontWeight: "700", fontSize: "14px", fontFamily: "inherit" }}
              >
                <User size={16} /> Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.4)", borderRadius: "12px", padding: "12px 28px", cursor: "pointer", fontWeight: "700", fontSize: "14px", fontFamily: "inherit" }}
              >
                <ChevronRight size={16} /> Sign Up Free
              </button>
            </div>
            <button
              onClick={() => setShowLimitModal(false)}
              style={{ marginTop: "16px", background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowShortcuts(false)}>
          <div style={{ background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "28px", minWidth: "340px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}><Terminal size={18} /> Keyboard Shortcuts</h2>
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

      {/* ── Interview Timer Setup Modal ─────────────────────────────────────── */}
      {showTimerSetup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowTimerSetup(false)}>
          <div style={{ background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "480px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <div style={{ color: t.text }}><Clock size={24} /></div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Interview Timer</h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: t.muted }}>Set duration and AI assistance level</p>
              </div>
            </div>

            {/* Mode selector */}
            <div style={{ marginBottom: "22px" }}>
              <div style={{ fontSize: "11px", color: t.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Interview Mode</div>
              <div style={{ display: "flex", gap: "10px" }}>
                {INTERVIEW_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setInterviewMode(mode.id)}
                    style={{
                      flex: 1, padding: "14px 10px", borderRadius: "12px", cursor: "pointer",
                      border: `2px solid ${interviewMode === mode.id ? mode.color : t.border}`,
                      background: interviewMode === mode.id ? mode.bg : t.card,
                      transition: "all 0.2s",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                    }}
                  >
                    <span style={{ color: interviewMode === mode.id ? mode.color : t.text }}>{mode.emoji}</span>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: interviewMode === mode.id ? mode.color : t.text }}>{mode.label}</span>
                    <span style={{ fontSize: "10px", color: t.muted, textAlign: "center", lineHeight: 1.4 }}>{mode.title}</span>
                  </button>
                ))}
              </div>

              {/* Active mode description */}
              {(() => {
                const cfg = INTERVIEW_MODES.find((m) => m.id === interviewMode);
                return (
                  <div style={{ marginTop: "12px", padding: "12px 16px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "10px", fontSize: "13px" }}>
                    <div style={{ color: cfg.color, fontWeight: "700", marginBottom: "4px" }}>{cfg.emoji} {cfg.title} Mode</div>
                    <div style={{ color: t.muted, lineHeight: 1.5 }}>{cfg.longDesc}</div>
                    <div style={{ marginTop: "8px", fontSize: "12px", display: "flex", gap: "14px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: !cfg.blockReview ? "#22c55e" : "#ef4444" }}>
                        {!cfg.blockReview ? <Check size={12} /> : <X size={12} />} AI Review
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: !cfg.blockChat ? "#22c55e" : "#ef4444" }}>
                        {!cfg.blockChat ? <Check size={12} /> : <X size={12} />} AI Chat
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Duration picker */}
            <div style={{ marginBottom: "22px" }}>
              <div style={{ fontSize: "11px", color: t.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Duration</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.seconds}
                    onClick={() => { setTimerSeconds(opt.seconds); setTimerLeft(opt.seconds); }}
                    style={{ background: timerSeconds === opt.seconds ? "#4f46e5" : t.card, color: timerSeconds === opt.seconds ? "white" : t.text, border: `1px solid ${timerSeconds === opt.seconds ? "#4f46e5" : t.border}`, borderRadius: "10px", padding: "12px", cursor: "pointer", fontWeight: "700", fontSize: "15px", transition: "all 0.2s" }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={() => {
                const cfg = INTERVIEW_MODES.find((m) => m.id === interviewMode);
                if (cfg.blockChat) setChatOpen(false);
                setTimerMode(true);
                setTimerRunning(true);
                setTimerLeft(timerSeconds);
                setShowTimerSetup(false);
                toast.success(`${cfg.emoji} ${cfg.title} Interview started! ${cfg.blockReview && cfg.blockChat ? "AI fully disabled." : cfg.blockChat ? "Chat disabled." : "Good luck!"}`);
              }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: `linear-gradient(135deg, ${activeModeConfig.color}, ${activeModeConfig.color}cc)`, color: "white", border: "none", borderRadius: "12px", padding: "14px", width: "100%", cursor: "pointer", fontWeight: "800", fontSize: "15px", fontFamily: "inherit", boxShadow: `0 4px 20px ${activeModeConfig.color}44` }}
            >
              <Play size={16} /> Start {activeModeConfig.title} Interview
            </button>
          </div>
        </div>
      )}

      {/* ── Guest Banner ───────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <div
          className="guest-banner"
          style={{ marginBottom: "12px", background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,238,0.08))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}
        >
          <span style={{ fontSize: "13px", color: "#a5b4fc", display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={14} /> <strong>Guest Mode</strong> — {GUEST_LIMIT - guestReviews} review{GUEST_LIMIT - guestReviews !== 1 ? "s" : ""} &amp; {GUEST_LIMIT - guestRuns} run{GUEST_LIMIT - guestRuns !== 1 ? "s" : ""} left today
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => navigate("/login")}
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", border: "none", borderRadius: "8px", padding: "6px 16px", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "inherit" }}
            >
              Login for unlimited access
            </button>
            <button
              onClick={() => navigate("/signup")}
              style={{ background: "transparent", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.35)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "inherit" }}
            >
              Sign Up Free
            </button>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal ──────────────────────────────────────── */}
      {showCancelConfirm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            className="limit-modal"
            style={{ background: t.modalBg, border: `1px solid ${activeModeConfig.border}`, borderRadius: "20px", padding: "36px 32px", maxWidth: "400px", width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.7)", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: "#ef4444" }}><XCircle size={44} /></div>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#f1f5f9", marginBottom: "10px" }}>Cancel Interview?</h2>
            <p style={{ color: t.muted, fontSize: "13px", lineHeight: "1.7", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              You are in <strong style={{ color: activeModeConfig.color, display: "flex", alignItems: "center", gap: "4px" }}>{activeModeConfig.emoji} {activeModeConfig.title} mode</strong>
            </p>
            <p style={{ color: t.muted, fontSize: "13px", lineHeight: "1.7", marginBottom: "28px" }}>
              Time elapsed: <strong style={{ color: "#f1f5f9" }}>{formatTimer(timerSeconds - timerLeft)}</strong> of <strong style={{ color: "#f1f5f9" }}>{formatTimer(timerSeconds)}</strong>.
              <br />Are you sure you want to end this session?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={cancelTimer}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "12px", padding: "12px 28px", cursor: "pointer", fontWeight: "700", fontSize: "14px", fontFamily: "inherit", transition: "all 0.2s" }}
              >
                <X size={16} /> Yes, Cancel Interview
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: "12px", padding: "12px 28px", cursor: "pointer", fontWeight: "700", fontSize: "14px", fontFamily: "inherit" }}
              >
                <Play size={16} /> Keep Going
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Interview Mode Banner ───────────────────────────────────────── */}
      {timerMode && (() => {
        const cfg = activeModeConfig;
        const elapsed = timerSeconds - timerLeft;
        return (
          <div
            className="interview-bar"
            style={{ marginBottom: "12px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "12px", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}
          >
            {/* Left: mode info + restrictions */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span className="lock-pulse" style={{ display: "flex", alignItems: "center", color: cfg.color }}>{cfg.emoji}</span>
              <span style={{ fontSize: "13px", fontWeight: "800", color: cfg.color }}>{cfg.title} Interview</span>
              <span style={{ fontSize: "12px", color: t.muted }}>|</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: timerLeft < 300 ? "#ef4444" : "#f1f5f9", fontWeight: "700", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
                {timerLeft < 300 ? <AlertTriangle size={12} /> : ""}{formatTimer(timerLeft)} left
              </span>
              <span style={{ fontSize: "12px", color: t.muted }}>|</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: !cfg.blockReview ? "#22c55e" : "#ef4444" }}>
                {!cfg.blockReview ? <Check size={12} /> : <X size={12} />} Review
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: !cfg.blockChat ? "#22c55e" : "#ef4444" }}>
                {!cfg.blockChat ? <Check size={12} /> : <X size={12} />} Chat
              </span>
            </div>

            {/* Right: controls */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* Pause / Resume */}
              <button
                onClick={() => setTimerRunning((r) => !r)}
                style={{ background: timerRunning ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)", color: timerRunning ? "#f59e0b" : "#22c55e", border: `1px solid ${timerRunning ? "rgba(245,158,11,0.35)" : "rgba(34,197,94,0.35)"}`, borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "5px" }}
              >
                {timerRunning ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
              </button>
              {/* Cancel */}
              <button
                onClick={() => { setTimerRunning(false); setShowCancelConfirm(true); }}
                style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {/* Premium Header Navbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "16px", borderBottom: `1px solid ${t.border}`, flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ background: "linear-gradient(135deg,#6366f1,#22d3ee)", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "900", fontSize: "16px" }}>
            <Code2 size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px", background: "linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              CodeReview AI
            </h1>
            <p style={{ color: t.muted, margin: "2px 0 0", fontSize: "12px", fontWeight: "500" }}>
              Premium Code Execution &amp; Review
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {timerMode && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: timerLeft < 300 ? "rgba(239,68,68,0.15)" : activeModeConfig.bg, border: `1px solid ${timerLeft < 300 ? "#ef4444" : activeModeConfig.border}`, borderRadius: "10px", padding: "6px 12px" }}>
              <span style={{ display: "flex", alignItems: "center", color: activeModeConfig.color }}>{activeModeConfig.emoji}</span>
              <span className={timerLeft < 300 ? "timer-warning" : ""} style={{ fontSize: "15px", fontWeight: "800", color: timerLeft < 300 ? "#ef4444" : activeModeConfig.color, letterSpacing: "1px", fontVariantNumeric: "tabular-nums" }}>
                {formatTimer(timerLeft)}
              </span>
              <button onClick={() => setTimerRunning((r) => !r)} style={{ ...smallBtn, padding: "2px 8px", fontSize: "11px", color: timerRunning ? "#f59e0b" : "#22c55e", display: "flex", alignItems: "center" }}>
                {timerRunning ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                onClick={() => { setTimerRunning(false); setShowCancelConfirm(true); }}
                style={{ ...smallBtn, padding: "2px 8px", fontSize: "11px", color: "#f87171", borderColor: "rgba(239,68,68,0.35)", display: "flex", alignItems: "center" }}
                title="Cancel interview"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <button onClick={() => setShowTimerSetup(true)} style={{ background: t.toggleBg, color: t.text, border: `1px solid ${t.border}`, padding: "8px 14px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={14} /> Timer
          </button>
          <button onClick={() => setShowShortcuts(true)} style={{ background: t.toggleBg, color: t.text, border: `1px solid ${t.border}`, padding: "8px 14px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <Terminal size={14} /> Shortcuts
          </button>
          {/* AI Chat button — hidden in Med/Strict interview mode */}
          {!(timerMode && activeModeConfig.blockChat) && (
            <button onClick={() => setChatOpen(!chatOpen)} style={{ background: chatOpen ? "#4f46e5" : t.toggleBg, color: chatOpen ? "white" : t.text, border: `1px solid ${chatOpen ? "#4f46e5" : t.border}`, padding: "8px 14px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
              <MessageSquare size={14} /> AI Chat {chatOpen ? <ChevronRight size={14} /> : <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />}
            </button>
          )}
          {timerMode && activeModeConfig.blockChat && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", color: "#f87171", display: "flex", alignItems: "center", gap: "6px", opacity: 0.8 }}>
              <Lock size={12} /> Chat Locked
            </div>
          )}
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: t.toggleBg, color: t.toggleText, border: `1px solid ${t.border}`, padding: "8px 14px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            {darkMode ? <><Sun size={14} /> Light</> : <><Moon size={14} /> Dark</>}
          </button>

          {/* Auth section */}
          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "linear-gradient(135deg,#6366f1,#22d3ee)", borderRadius: "50%", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "14px", flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: t.text, lineHeight: 1.2 }}>{user?.name}</span>
                <span style={{ fontSize: "10px", color: t.muted }}>Unlimited access</span>
              </div>
              <button
                onClick={() => { logout(); navigate("/"); }}
                style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "inherit" }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", border: "none", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit" }}
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", gap: "24px", flex: 1, overflow: "hidden" }}>

        {/* Left: editor column */}
        <div className="left-column" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto", paddingRight: "8px" }}>

          {/* Controls row */}
          <div className="pro-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <select className="pro-select" value={language} onChange={handleLanguageChange}>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </select>
              
              <select className="pro-select" onChange={handleTemplate} value="">
                <option value="" disabled>🚀 Load Template...</option>
                <option value="javascript">React / Node.js</option>
                <option value="python">Python Script</option>
                <option value="java">Java Main Class</option>
                <option value="cpp">C++ Boilerplate</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
              
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button className="pro-btn" title="Editor Settings" onClick={() => setShowSettings(!showSettings)}>
                  <Settings size={16} />
                </button>
                <button className="pro-btn" onClick={handleFormat}>
                  <Code2 size={16} /> Format
                </button>
                <button className="pro-btn" onClick={() => copy(code, "Code")}>
                  <Copy size={16} /> Copy
                </button>
                <button className="pro-btn" onClick={() => setTestMode((m) => !m)} style={{ background: testMode ? "rgba(99,102,241,0.2)" : "", color: testMode ? "#a5b4fc" : "" }}>
                  <ShieldAlert size={16} /> Tests {testMode ? "▲" : "▼"}
                </button>
              </div>

              {/* Guest usage counters */}
              {!isAuthenticated && (
                <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: t.muted, padding: "0 8px", borderLeft: `1px solid rgba(255,255,255,0.1)`, borderRight: `1px solid rgba(255,255,255,0.1)` }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", borderRadius: "20px", padding: "4px 10px", fontWeight: "600" }}>
                    <Search size={12} /> {guestReviews}/{GUEST_LIMIT} reviews
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", borderRadius: "20px", padding: "4px 10px", fontWeight: "600" }}>
                    <Play size={12} /> {guestRuns}/{GUEST_LIMIT} runs
                  </span>
                </div>
              )}

              {/* Settings Dropdown Panel (Absolute positioned) */}
              {showSettings && (
                <div style={{ position: "absolute", zIndex: 10, right: "40px", marginTop: "120px", background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(16px)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "12px", padding: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", width: "240px" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Editor Settings</h4>
                  
                  <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", color: "#e2e8f0" }}>Theme</label>
                  <select className="pro-select" value={editorTheme} onChange={e => setEditorTheme(e.target.value)} style={{ width: "100%", marginBottom: "16px" }}>
                    <option value="vs-dark">VS Dark</option>
                    <option value="hc-black">High Contrast</option>
                    <option value="vs-light">VS Light</option>
                  </select>

                  <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", color: "#e2e8f0" }}>Font Size: {fontSize}px</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="pro-btn" onClick={() => setFontSize(f => Math.max(10, f - 1))} style={{ flex: 1, justifyContent: "center" }}>A-</button>
                    <button className="pro-btn" onClick={() => setFontSize(f => Math.min(24, f + 1))} style={{ flex: 1, justifyContent: "center" }}>A+</button>
                  </div>
                </div>
              )}

              {/* Primary Actions Group */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className="pro-primary-btn"
                  onClick={handleReview}
                  disabled={loading}
                  title={timerMode && timerRunning && activeModeConfig.blockReview ? `AI Review locked in ${activeModeConfig.title} mode` : ""}
                  style={{
                    background: timerMode && timerRunning && activeModeConfig.blockReview ? "#7f1d1d" : t.btnReview,
                    color: "white",
                    border: timerMode && timerRunning && activeModeConfig.blockReview ? "1px solid rgba(239,68,68,0.6)" : "none",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  {timerMode && timerRunning && activeModeConfig.blockReview
                    ? <><Lock size={14} /> Locked</>
                    : loading ? <><Loader2 size={14} className="spinner" /> Reviewing…</> : <><Search size={14} /> Review</>
                  }
                </button>
                <button className="pro-primary-btn" onClick={handleRun} disabled={loading} style={{ background: t.btnRun, color: "white", boxShadow: "0 4px 14px rgba(34, 197, 94, 0.3)" }}>
                  {loading ? <><Loader2 size={14} className="spinner" /> Running…</> : <><Play size={14} /> Run</>}
                </button>
              </div>
            </div>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, minHeight: "350px", display: "flex", flexDirection: "column", borderRadius: "14px", overflow: "hidden", border: `1px solid ${t.border}`, opacity: loading ? 0.55 : 1, pointerEvents: loading ? "none" : "auto", transition: "opacity 0.25s", marginBottom: "20px" }}>
            <Editor
              height="100%"
              theme={editorTheme}
              language={language}
              value={code}
              onChange={(v) => setCode(v)}
              onMount={(editor) => { editorRef.current = editor; }}
              options={{ fontSize: fontSize, minimap: { enabled: false }, scrollBeyondLastLine: false }}
            />
          </div>
          <div style={{ flexShrink: 0 }}>
          {!testMode && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "13px", color: t.muted, fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <Terminal size={14} /> Custom Input <span style={{ fontSize: "11px", marginLeft: "8px", opacity: 0.6 }}>Ctrl+Enter to run</span>
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
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}><ShieldAlert size={16} /> Test Cases</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={addTestCase} style={{ ...smallBtn, background: "#1e293b", color: "#22d3ee", borderColor: "#22d3ee", fontSize: "13px" }}>+ Add Case</button>
                  <button
                    onClick={handleRunAllTests}
                    disabled={testLoading}
                    style={{ background: "#16a34a", color: "white", border: "none", borderRadius: "8px", padding: "6px 16px", cursor: testLoading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", opacity: testLoading ? 0.7 : 1 }}
                  >
                    {testLoading ? <><Loader2 size={12} className="spinner" /> Running…</> : <><Play size={12} /> Run All</>}
                  </button>
                </div>
              </div>

              {/* Stats bar */}
              {testCases.some((tc) => tc.status !== "idle") && (
                <div style={{ padding: "10px 18px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: "16px", fontSize: "13px" }}>
                  <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} /> {testCases.filter((tc) => tc.status === "pass").length} Passed</span>
                  <span style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}><X size={14} /> {testCases.filter((tc) => tc.status === "fail").length} Failed</span>
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
                      <button onClick={() => removeTestCase(tc.id)} style={{ background: "none", border: "none", color: t.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
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

          {/* Output + Review grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px" }}>
            {/* Output panel */}
            <div style={{ background: t.surface, borderRadius: "14px", padding: "20px", border: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Terminal size={16} /> Output</h2>
                <button onClick={() => copy(output, "Output")} style={smallBtn}>Copy</button>
              </div>
              {stats && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", background: t.statBg, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", color: t.muted }}>
                    <Clock size={12} /> <strong style={{ color: t.text }}>{stats.time}</strong>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", background: t.statBg, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", color: t.muted }}>
                    <Server size={12} /> <strong style={{ color: t.text }}>{stats.memory}</strong>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", background: t.statBg, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", color: t.muted }}>
                    <CheckCircle2 size={12} /> <strong style={{ color: statusColor(stats.status) }}>{stats.status}</strong>
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
                <h2 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Search size={16} /> AI Review</h2>
                <button onClick={() => copy(review, "Review")} style={smallBtn}>Copy</button>
              </div>
              <div style={{ background: t.pre, padding: "16px", borderRadius: "10px", minHeight: "200px", color: t.preText, overflowX: "auto", lineHeight: "1.8", fontSize: "14px" }}>
                {loading
                  ? <span style={{ color: t.muted, display: "flex", alignItems: "center", gap: "10px" }}><Loader2 size={16} className="spinner" /> Generating review…</span>
                  : <ReactMarkdown>{review || "AI review will appear here…"}</ReactMarkdown>}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Right: AI Chat panel */}
        {chatOpen && (
          <div style={{ width: "360px", flexShrink: 0, background: t.chatBg, borderRadius: "16px", border: `1px solid ${t.chatBorder}`, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.chatBorder}`, background: t.chatSurface, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}><MessageSquare size={16} /> AI Chat Assistant</div>
                <div style={{ fontSize: "12px", color: t.muted, marginTop: "2px" }}>Ask about your {language} code</div>
              </div>
              <button onClick={() => setChatMessages([{ role: "assistant", text: "Chat cleared! Ask me anything about your code." }])} style={{ ...smallBtn, fontSize: "12px", padding: "4px 10px" }}>Clear</button>
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
                  <div className="markdown-body" style={{ maxWidth: "88%", background: msg.role === "user" ? t.chatUser : t.chatAI, color: msg.role === "user" ? "white" : t.text, borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 14px", fontSize: "13px", lineHeight: "1.7", border: msg.role === "assistant" ? `1px solid ${t.chatBorder}` : "none" }}>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                placeholder="Ask about your code…"
                disabled={chatLoading}
                style={{ flex: 1, background: t.chatBg, color: t.text, border: `1px solid ${t.chatBorder}`, borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "inherit", outline: "none", opacity: chatLoading ? 0.7 : 1 }}
              />
              <button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#4f46e5", color: "white", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", fontSize: "18px", opacity: chatLoading || !chatInput.trim() ? 0.6 : 1 }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeEditor;
