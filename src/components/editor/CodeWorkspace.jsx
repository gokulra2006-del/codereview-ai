import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

export default function CodeWorkspace({
  code,
  setCode,
  language,
  editorTheme,
  fontSize,
  selectedFinding,
  editorRef,
  t,
}) {
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Highlight corresponding line range when a finding is selected
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (!selectedFinding) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const { startLine, endLine, severity } = selectedFinding;

    // Severity based background color
    const lineClass =
      severity === "critical" || severity === "high"
        ? "finding-line-high"
        : severity === "medium"
        ? "finding-line-med"
        : "finding-line-low";

    const newDecorations = [
      {
        range: new monaco.Range(startLine, 1, endLine, 1),
        options: {
          isWholeLine: true,
          className: lineClass,
          glyphMarginClassName: "finding-glyph-margin",
          overviewRuler: {
            color: severity === "critical" || severity === "high" ? "#ef4444" : "#f59e0b",
            position: monaco.editor.OverviewRulerLane.Full,
          },
        },
      },
    ];

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);

    // Scroll smoothly to line
    editor.revealLineInCenter(startLine);
  }, [selectedFinding, editorRef]);

  return (
    <div
      style={{
        background: t.surface,
        borderRadius: "14px",
        overflow: "hidden",
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
        height: "560px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        .finding-line-high {
          background: rgba(239, 68, 68, 0.18) !important;
          border-left: 3px solid #ef4444 !important;
        }
        .finding-line-med {
          background: rgba(245, 158, 11, 0.18) !important;
          border-left: 3px solid #f59e0b !important;
        }
        .finding-line-low {
          background: rgba(99, 102, 241, 0.18) !important;
          border-left: 3px solid #6366f1 !important;
        }
      `}</style>

      {/* Editor Header */}
      <div
        style={{
          padding: "10px 16px",
          background: t.card,
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: t.muted,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          <span style={{ marginLeft: "8px", fontWeight: "600", color: t.text }}>
            workspace.{language === "cpp" ? "cpp" : language === "python" ? "py" : language === "java" ? "java" : "js"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <span>Lines: {code.split("\n").length}</span>
          <span>Chars: {code.length}</span>
        </div>
      </div>

      {/* Monaco Container */}
      <div style={{ flex: 1, position: "relative" }}>
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={editorTheme}
          onChange={(val) => setCode(val || "")}
          onMount={handleEditorDidMount}
          options={{
            fontSize: fontSize || 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            lineNumbersMinChars: 3,
            renderLineHighlight: "all",
          }}
        />
      </div>
    </div>
  );
}
