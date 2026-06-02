import { useState } from "react";
import Editor from "@monaco-editor/react";
import toast, { Toaster } from "react-hot-toast";

import {
  reviewCode,
  runCode,
} from "../services/api";

function CodeEditor() {
  const [code, setCode] = useState(
`#include<iostream>
using namespace std;

int main() {
  int a, b;
  cin >> a >> b;
  cout << a + b;
}`
  );

  const [language, setLanguage] =
    useState("cpp");

  const [output, setOutput] =
    useState("");

  const [review, setReview] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const languageMap = {
    cpp: 54,
    python: 71,
    java: 62,
    javascript: 63,
  };

  const handleReview = async () => {
    try {
      setLoading(true);

      const data = await reviewCode(
        code,
        language
      );

      setReview(data.review);

      toast.success("Review completed");
    } catch (error) {
      console.error(error);

      toast.error("Review failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    try {
      setLoading(true);

      const data = await runCode(
        code,
        language,
        languageMap[language]
      );

      setOutput(
        data.stdout ||
        data.stderr ||
        data.compile_output ||
        "No output"
      );

      toast.success("Code executed");
    } catch (error) {
      console.error(error);

      toast.error("Execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "#0f172a",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <Toaster />

      <h1
        style={{
          fontSize: "32px",
          marginBottom: "20px",
        }}
      >
        CodeReview AI
      </h1>

      <select
        value={language}
        onChange={(e) =>
          setLanguage(e.target.value)
        }
        style={{
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        <option value="cpp">C++</option>
        <option value="python">
          Python
        </option>
        <option value="java">Java</option>
        <option value="javascript">
          JavaScript
        </option>
      </select>

      <Editor
        height="400px"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={(value) =>
          setCode(value)
        }
      />

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={handleReview}
          disabled={loading}
          style={{
            padding: "12px 20px",
            background: "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Review Code
        </button>

        <button
          onClick={handleRun}
          disabled={loading}
          style={{
            padding: "12px 20px",
            background: "#16a34a",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Run Code
        </button>
      </div>

      <div
        style={{
          marginTop: "30px",
        }}
      >
        <h2>Output</h2>

        <pre
          style={{
            background: "#1e293b",
            padding: "15px",
            borderRadius: "10px",
          }}
        >
          {output}
        </pre>
      </div>

      <div
        style={{
          marginTop: "30px",
        }}
      >
        <h2>AI Review</h2>

        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#1e293b",
            padding: "15px",
            borderRadius: "10px",
          }}
        >
          {review}
        </pre>
      </div>
    </div>
  );
}

export default CodeEditor;