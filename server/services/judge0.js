import axios from "axios";
import { config } from "../config.js";
import { ApiError } from "../middleware/errors.js";

export const LANGUAGE_MAP = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
};

export async function executeCode(sourceCode, languageId, stdin = "") {
  if (!languageId) {
    throw new ApiError(400, "INVALID_LANGUAGE", "Unsupported execution language or missing language ID.");
  }

  try {
    const response = await axios.post(
      `${config.judge0BaseUrl}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || "",
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );

    const data = response.data || {};
    return {
      stdout: data.stdout || "",
      stderr: data.stderr || "",
      compile_output: data.compile_output || "",
      time: data.time || null,
      memory: data.memory || null,
      status: {
        id: data.status?.id || 0,
        description: data.status?.description || "Completed",
      },
    };
  } catch (error) {
    console.error("[Judge0 Execution Warning]", error.message);
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      throw new ApiError(504, "EXECUTION_TIMEOUT", "Execution timed out. Please check for infinite loops or heavy computations.");
    }

    throw new ApiError(502, "EXECUTION_SERVICE_UNAVAILABLE", "Code execution engine is temporarily unavailable. Please try again shortly.");
  }
}

// Concurrency pool helper for executing test cases in parallel with safe limit
export async function executeTestCasesConcurrently(
  sourceCode,
  languageId,
  testCases = [],
  concurrencyLimit = 3
) {
  const results = new Array(testCases.length);
  let activeIndex = 0;

  async function worker() {
    while (activeIndex < testCases.length) {
      const idx = activeIndex++;
      const tc = testCases[idx];
      const startTime = Date.now();

      try {
        const execution = await executeCode(sourceCode, languageId, tc.input || "");
        const actualOutput = (execution.stdout || execution.stderr || execution.compile_output || "").trim();
        const expectedOutput = (tc.expectedOutput || "").trim();
        const passed = execution.status.id === 3 && !execution.stderr && !execution.compile_output && actualOutput === expectedOutput;

        results[idx] = {
          id: tc.id || `tc-${idx}`,
          name: tc.name || `Test #${idx + 1}`,
          input: tc.input || "",
          expectedOutput,
          actualOutput,
          passed,
          status: passed ? "pass" : "fail",
          executionTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
          time: execution.time,
          memory: execution.memory,
          isAiGenerated: !!tc.isAiGenerated,
          error: execution.stderr || execution.compile_output || null,
        };
      } catch (err) {
        results[idx] = {
          id: tc.id || `tc-${idx}`,
          name: tc.name || `Test #${idx + 1}`,
          input: tc.input || "",
          expectedOutput: tc.expectedOutput || "",
          actualOutput: "",
          passed: false,
          status: "error",
          error: err.message,
          isAiGenerated: !!tc.isAiGenerated,
        };
      }
    }
  }

  const pool = [];
  const workerCount = Math.min(concurrencyLimit, testCases.length);
  for (let i = 0; i < workerCount; i++) {
    pool.push(worker());
  }
  await Promise.all(pool);

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    results,
  };
}
