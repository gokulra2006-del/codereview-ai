import { useState } from "react";
import toast from "react-hot-toast";
import { runCode, runBatchTests } from "../services/api";

export const LANGUAGE_IDS = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
};

export function useCodeExecution({ checkQuota, refreshQuota, triggerLimitModal }) {
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const [testCases, setTestCases] = useState([
    { id: 1, name: "Sample Case 1", input: "10 20", expectedOutput: "30", actualOutput: "", status: "idle" },
    { id: 2, name: "Sample Case 2", input: "0 0", expectedOutput: "0", actualOutput: "", status: "idle" },
  ]);

  const handleRun = async (code, language, stdin = "") => {
    if (!checkQuota("run")) return;

    try {
      setLoading(true);
      setStats(null);
      setOutput("");

      const langId = LANGUAGE_IDS[language];
      const data = await runCode(code, language, langId, stdin);

      const stdout = data.stdout || "";
      const stderr = data.stderr || "";
      const compile = data.compile_output || "";

      setOutput(stdout || stderr || compile || "Execution completed (no output).");
      setStats({
        time: data.time ? `${data.time}s` : "N/A",
        memory: data.memory ? `${data.memory} KB` : "N/A",
        status: data.status?.description || "Completed",
      });

      if (stderr || compile) {
        toast.error("Execution finished with errors");
      } else {
        toast.success("Code Executed Successfully");
      }

      refreshQuota();
    } catch (err) {
      if (err.code === "QUOTA_EXCEEDED") {
        triggerLimitModal("run");
      } else {
        toast.error(err.message || "Execution Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllTests = async (code, language, casesToRun = null) => {
    if (!checkQuota("run")) return;

    const list = casesToRun || testCases;
    const validCases = list.filter((tc) => tc.input || tc.expectedOutput);

    if (validCases.length === 0) {
      toast("Add at least one test case with input or expected output", { icon: "ℹ️" });
      return;
    }

    try {
      setTestLoading(true);
      const langId = LANGUAGE_IDS[language];
      const report = await runBatchTests(code, language, langId, validCases, 3);

      const updated = list.map((tc) => {
        const found = report.results?.find((r) => r.id === tc.id || r.name === tc.name);
        if (found) {
          return {
            ...tc,
            actualOutput: found.actualOutput,
            status: found.status,
            executionTime: found.executionTime,
            error: found.error,
          };
        }
        return tc;
      });

      setTestCases(updated);
      toast.success(`Tests Completed: ${report.passed}/${report.total} passed`);
      refreshQuota();
      return report;
    } catch (err) {
      if (err.code === "QUOTA_EXCEEDED") {
        triggerLimitModal("run");
      } else {
        toast.error(err.message || "Test Execution Failed");
      }
    } finally {
      setTestLoading(false);
    }
  };

  const addTestCase = (newCase = null) => {
    const item = newCase || {
      id: Date.now(),
      name: `Test Case ${testCases.length + 1}`,
      input: "",
      expectedOutput: "",
      actualOutput: "",
      status: "idle",
      isAiGenerated: false,
    };
    setTestCases((prev) => [...prev, item]);
  };

  const removeTestCase = (id) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const updateTestCase = (id, field, value) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, [field]: value, status: "idle" } : tc))
    );
  };

  return {
    output,
    setOutput,
    stats,
    loading,
    testLoading,
    testCases,
    setTestCases,
    handleRun,
    handleRunAllTests,
    addTestCase,
    removeTestCase,
    updateTestCase,
  };
}
