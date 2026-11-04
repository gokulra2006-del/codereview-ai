import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { chatWithAI, saveSession, getSessionById } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Hooks
import { useGuestQuota } from "../hooks/useGuestQuota";
import { useInterviewTimer } from "../hooks/useInterviewTimer";
import { useCodeExecution } from "../hooks/useCodeExecution";
import { useCodeReview } from "../hooks/useCodeReview";
import { usePatchManager } from "../hooks/usePatchManager";

// Components
import EditorToolbar from "./editor/EditorToolbar";
import CodeWorkspace from "./editor/CodeWorkspace";
import OutputPanel from "./editor/OutputPanel";
import ReviewPanel from "./editor/ReviewPanel";
import TestCasePanel from "./editor/TestCasePanel";
import InterviewTimer from "./editor/InterviewTimer";
import AIChatPanel from "./editor/AIChatPanel";
import SettingsPanel from "./editor/SettingsPanel";
import FixDiffModal from "./editor/FixDiffModal";
import VerificationReportModal from "./editor/VerificationReportModal";
import ShortcutsModal from "./editor/ShortcutsModal";
import LimitModal from "./editor/LimitModal";

const STARTER_TEMPLATES = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << a + b;
    }
    return 0;
}`,
  python: `def calculate(a, b):
    return a + b

if __name__ == "__main__":
    import sys
    inputs = sys.stdin.read().split()
    if len(inputs) >= 2:
        print(calculate(int(inputs[0]), int(inputs[1])))
    else:
        print("Hello from Verified CodeReview AI")`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            System.out.println(a + b);
        }
    }
}`,
  javascript: `const fs = require("fs");

function solve() {
    const input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);
    if (input.length >= 2) {
        const a = Number(input[0]);
        const b = Number(input[1]);
        console.log(a + b);
    } else {
        console.log("Verified CodeReview Workspace running.");
    }
}

solve();`,
};

export default function CodeEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get("session");
  const { user, isAuthenticated, logout } = useAuth();

  // Core editor state
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(() => {
    return localStorage.getItem("cr_code_draft") || STARTER_TEMPLATES.cpp;
  });
  const [originalCodeSnapshot, setOriginalCodeSnapshot] = useState("");
  const [stdin, setStdin] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);

  // UI Drawer / modal states
  const [chatOpen, setChatOpen] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to the Verified Code Review Workspace! Run reviews to identify actionable fixes, test regression cases, and chat about optimizations.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const editorRef = useRef(null);

  // Hooks integration
  const quotaManager = useGuestQuota(isAuthenticated);
  const timerManager = useInterviewTimer();
  const executionManager = useCodeExecution({
    checkQuota: quotaManager.checkQuota,
    refreshQuota: quotaManager.refreshQuota,
    triggerLimitModal: quotaManager.triggerLimitModal,
  });
  const reviewManager = useCodeReview({
    checkQuota: quotaManager.checkQuota,
    refreshQuota: quotaManager.refreshQuota,
    triggerLimitModal: quotaManager.triggerLimitModal,
    activeModeConfig: timerManager.activeModeConfig,
  });
  const patchManager = usePatchManager({
    code,
    setCode,
    originalCodeSnapshot,
    setOriginalCodeSnapshot,
  });

  // Preserve unsaved draft locally
  useEffect(() => {
    localStorage.setItem("cr_code_draft", code);
  }, [code]);

  // Sync theme
  useEffect(() => {
    setEditorTheme(darkMode ? "vs-dark" : "vs-light");
  }, [darkMode]);

  // Load existing session if query param present
  useEffect(() => {
    if (!sessionIdParam) return;
    const loadSession = async () => {
      try {
        const data = await getSessionById(sessionIdParam);
        if (data?.session) {
          const s = data.session;
          setCurrentSessionId(s.sessionId);
          setLanguage(s.language);
          setCode(s.currentCode || s.originalCode);
          setOriginalCodeSnapshot(s.originalCode);
          if (s.structuredFindings) {
            reviewManager.setStructuredReview(s.structuredFindings);
          }
          if (s.tests && s.tests.length > 0) {
            executionManager.setTestCases(s.tests);
          }
          toast.success("Loaded saved review session");
        }
      } catch (err) {
        toast.error("Could not load session");
      }
    };
    loadSession();
  }, [sessionIdParam]);

  // Set original snapshot on first review
  const triggerReview = async () => {
    if (!originalCodeSnapshot) {
      setOriginalCodeSnapshot(code);
    }
    await reviewManager.handleReview(code, language);
  };

  const triggerRun = async () => {
    await executionManager.handleRun(code, language, stdin);
  };

  const triggerGenerateTests = async () => {
    const aiTests = await reviewManager.handleGenerateTests(code, language);
    if (aiTests && aiTests.length > 0) {
      executionManager.setTestCases((prev) => [...aiTests, ...prev]);
      setTestMode(true);
    }
  };

  const triggerVerifyFixes = async () => {
    await reviewManager.handleVerifyFixes({
      originalCode: originalCodeSnapshot || code,
      patchedCode: code,
      language,
      acceptedFixes: patchManager.acceptedFixes,
      approvedTests: executionManager.testCases.filter((tc) => tc.input || tc.expectedOutput),
    });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    if (code.trim().length > 0 && code !== STARTER_TEMPLATES[language]) {
      if (!window.confirm("Changing language will replace the current code. Continue?")) {
        return;
      }
    }
    setLanguage(newLang);
    setCode(STARTER_TEMPLATES[newLang] || "");
    setOriginalCodeSnapshot("");
    reviewManager.setStructuredReview(null);
  };

  const handleTemplateChange = (e) => {
    const lang = e.target.value;
    if (!lang) return;
    if (code.trim().length > 0 && code !== STARTER_TEMPLATES[language]) {
      if (!window.confirm("Load template? This will replace your current editor content.")) {
        return;
      }
    }
    setLanguage(lang);
    setCode(STARTER_TEMPLATES[lang] || "");
    setOriginalCodeSnapshot("");
    reviewManager.setStructuredReview(null);
    toast.success(`${lang.toUpperCase()} starter template loaded.`);
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
      toast.success("Code formatted");
    }
  };

  const handleSaveSession = async () => {
    try {
      setSaveLoading(true);
      const sessionData = {
        sessionId: currentSessionId || undefined,
        language,
        originalCode: originalCodeSnapshot || code,
        currentCode: code,
        originalScore: reviewManager.structuredReview?.overallScore || 0,
        finalScore: reviewManager.verificationReport?.scoreAfter || reviewManager.structuredReview?.overallScore || 0,
        structuredFindings: reviewManager.structuredReview || {},
        acceptedFixes: patchManager.acceptedFixes,
        rejectedFixes: patchManager.rejectedFixes,
        tests: executionManager.testCases,
        verificationResults: reviewManager.verificationReport,
      };

      const res = await saveSession(sessionData);
      if (res?.session) {
        setCurrentSessionId(res.session.sessionId);
        toast.success("Session saved! Accessible in your dashboard.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save session");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSendChat = async (promptText = null) => {
    const q = promptText || chatInput.trim();
    if (!q) return;

    if (timerManager.timerMode && timerManager.timerRunning && timerManager.activeModeConfig.blockChat) {
      toast.error(`AI Chat is disabled in ${timerManager.activeModeConfig.title} mode.`);
      return;
    }

    setChatMessages((prev) => [...prev, { role: "user", text: q }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const data = await chatWithAI(q, code, language);
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: `⚠️ ${err.message || "Unable to get AI response."}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Keyboard shortcuts with ref to prevent stale closures ───────────────────
  const latestRef = useRef({});
  latestRef.current = {
    code,
    language,
    triggerRun,
    triggerReview,
    setChatOpen,
    undoLastFix: patchManager.undoLastFix,
    setShowShortcuts,
    closeModals: () => {
      setShowShortcuts(false);
      setShowSettings(false);
      quotaManager.setShowLimitModal(false);
      patchManager.closeDiffPreview();
      reviewManager.setShowVerificationModal(false);
      timerManager.setShowTimerSetup(false);
    },
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = latestRef.current;
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        state.triggerRun();
      } else if (e.ctrlKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
        e.preventDefault();
        state.triggerReview();
      } else if (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c")) {
        e.preventDefault();
        state.setChatOpen((prev) => !prev);
      } else if (
        e.key === "?" &&
        !e.ctrlKey &&
        !e.altKey &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        state.setShowShortcuts((prev) => !prev);
      } else if (e.key === "Escape") {
        state.closeModals();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Theme definition
  const t = darkMode
    ? {
        bg: "#090d16",
        surface: "#0f172a",
        card: "#1e293b",
        border: "#334155",
        text: "#f8fafc",
        muted: "#94a3b8",
        pre: "#070b12",
        preText: "#f1f5f9",
        chatBg: "#0b0f19",
        chatSurface: "#161f30",
        chatUser: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        chatAI: "#131b2c",
        chatBorder: "#27354a",
        btnRun: "linear-gradient(135deg, #10b981, #059669)",
        btnRunText: "#ffffff",
        btnReview: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        btnReviewText: "#ffffff",
        shadow: "0 10px 30px rgba(0,0,0,0.45)",
      }
    : {
        bg: "#f8fafc",
        surface: "#ffffff",
        card: "#f1f5f9",
        border: "#cbd5e1",
        text: "#0f172a",
        muted: "#64748b",
        pre: "#f1f5f9",
        preText: "#0f172a",
        chatBg: "#f8fafc",
        chatSurface: "#ffffff",
        chatUser: "linear-gradient(135deg, #4f46e5, #6366f1)",
        chatAI: "#ffffff",
        chatBorder: "#cbd5e1",
        btnRun: "linear-gradient(135deg, #059669, #10b981)",
        btnRunText: "#ffffff",
        btnReview: "linear-gradient(135deg, #4f46e5, #6366f1)",
        btnReviewText: "#ffffff",
        shadow: "0 10px 30px rgba(0,0,0,0.06)",
      };

  const selectedFinding = reviewManager.structuredReview?.issues?.find(
    (i) => i.id === reviewManager.selectedIssueId
  );

  return (
    <div
      style={{
        background: t.bg,
        minHeight: "100vh",
        color: t.text,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Toaster position="top-right" />

      {/* Top Navbar */}
      <header
        style={{
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #6366f1, #22d3ee)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "900",
              color: "white",
            }}
          >
            &lt;/&gt;
          </div>
          <span
            style={{
              fontSize: "16px",
              fontWeight: "800",
              background: "linear-gradient(135deg, #a5b4fc, #67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CodeReview AI
          </span>
          <span
            style={{
              background: "rgba(99,102,241,0.15)",
              color: "#818cf8",
              fontSize: "10px",
              fontWeight: "800",
              padding: "2px 6px",
              borderRadius: "4px",
              textTransform: "uppercase",
            }}
          >
            Verified Fix Loop
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              color: t.text,
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Dashboard
          </button>

          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: t.muted }}>
                {user?.name?.split(" ")[0]} ({user?.plan || "free"})
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                style={{
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  color: t.muted,
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  color: t.text,
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/signup")}
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                  border: "none",
                  color: "white",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Sign Up Free
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Interview Timer Banner */}
        <InterviewTimer
          timerMode={timerManager.timerMode}
          timerLeft={timerManager.timerLeft}
          timerRunning={timerManager.timerRunning}
          interviewMode={timerManager.interviewMode}
          showTimerSetup={timerManager.showTimerSetup}
          showCancelConfirm={timerManager.showCancelConfirm}
          activeModeConfig={timerManager.activeModeConfig}
          setInterviewMode={timerManager.setInterviewMode}
          setShowTimerSetup={timerManager.setShowTimerSetup}
          setShowCancelConfirm={timerManager.setShowCancelConfirm}
          startTimer={timerManager.startTimer}
          togglePause={timerManager.togglePause}
          cancelTimer={timerManager.cancelTimer}
          formatTimer={timerManager.formatTimer}
          t={t}
        />

        {/* Action Toolbar */}
        <EditorToolbar
          language={language}
          setLanguage={setLanguage}
          onLanguageChange={handleLanguageChange}
          onTemplateChange={handleTemplateChange}
          onFormat={handleFormat}
          onReview={triggerReview}
          onRun={triggerRun}
          reviewLoading={reviewManager.loading}
          runLoading={executionManager.loading}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          testMode={testMode}
          setTestMode={setTestMode}
          setShowSettings={setShowSettings}
          setShowTimerSetup={timerManager.setShowTimerSetup}
          timerMode={timerManager.timerMode}
          interviewMode={timerManager.interviewMode}
          quota={quotaManager.quota}
          historyStackCount={patchManager.historyStack.length}
          onUndo={patchManager.undoLastFix}
          onSaveSession={handleSaveSession}
          saveLoading={saveLoading}
          t={t}
        />

        {/* Split Editor / Review Grid */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "flex-start",
            flexDirection: "row",
          }}
        >
          {/* Left Column: Monaco Code Editor + Output / Tests */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minWidth: 0,
            }}
          >
            <CodeWorkspace
              code={code}
              setCode={setCode}
              language={language}
              editorTheme={editorTheme}
              fontSize={fontSize}
              selectedFinding={selectedFinding}
              editorRef={editorRef}
              t={t}
            />

            {/* Test Cases Panel */}
            {testMode && (
              <TestCasePanel
                testCases={executionManager.testCases}
                testLoading={executionManager.testLoading}
                onRunAllTests={() => executionManager.handleRunAllTests(code, language)}
                onAddTestCase={() => executionManager.addTestCase()}
                onRemoveTestCase={executionManager.removeTestCase}
                onUpdateTestCase={executionManager.updateTestCase}
                t={t}
              />
            )}

            {/* Terminal Output */}
            <OutputPanel
              output={executionManager.output}
              stats={executionManager.stats}
              stdin={stdin}
              setStdin={setStdin}
              loading={executionManager.loading}
              t={t}
            />
          </div>

          {/* Center Column: Findings and Verified Fixes */}
          <div
            style={{
              width: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flexShrink: 0,
            }}
          >
            <ReviewPanel
              structuredReview={reviewManager.structuredReview}
              loading={reviewManager.loading}
              selectedIssueId={reviewManager.selectedIssueId}
              setSelectedIssueId={reviewManager.setSelectedIssueId}
              onPreviewFix={patchManager.openDiffPreview}
              acceptedFixes={patchManager.acceptedFixes}
              rejectedFixes={patchManager.rejectedFixes}
              onGenerateTests={triggerGenerateTests}
              onVerifyFixes={triggerVerifyFixes}
              verificationLoading={reviewManager.verificationLoading}
              t={t}
            />
          </div>

          {/* Right Drawer: AI Chat Panel */}
          {chatOpen && (
            <AIChatPanel
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              chatLoading={chatLoading}
              onSendChat={handleSendChat}
              onClearChat={() =>
                setChatMessages([
                  { role: "assistant", text: "Chat cleared! Ask any question about your code." },
                ])
              }
              onClose={() => setChatOpen(false)}
              language={language}
              t={t}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {patchManager.previewingIssue && (
        <FixDiffModal
          issue={patchManager.previewingIssue}
          originalCode={code}
          proposedCode={patchManager.previewProposedCode}
          conflictWarning={patchManager.patchConflictWarning}
          language={language}
          editorTheme={editorTheme}
          onApply={patchManager.applyFix}
          onReject={patchManager.rejectFix}
          onClose={patchManager.closeDiffPreview}
          t={t}
        />
      )}

      {reviewManager.showVerificationModal && (
        <VerificationReportModal
          report={reviewManager.verificationReport}
          onClose={() => reviewManager.setShowVerificationModal(false)}
          t={t}
        />
      )}

      {showSettings && (
        <SettingsPanel
          fontSize={fontSize}
          setFontSize={setFontSize}
          editorTheme={editorTheme}
          setEditorTheme={setEditorTheme}
          onClose={() => setShowSettings(false)}
          t={t}
        />
      )}

      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} t={t} />
      )}

      {quotaManager.showLimitModal && (
        <LimitModal
          limitType={quotaManager.limitType}
          onClose={() => quotaManager.setShowLimitModal(false)}
          t={t}
        />
      )}
    </div>
  );
}
