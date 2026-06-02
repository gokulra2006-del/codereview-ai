import axios from "axios";

export async function executeCode(
  sourceCode,
  languageId,
  stdin = ""   // ✅ stdin added
) {
  try {
    const response = await axios.post(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin,   // ✅ stdin passed to Judge0
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      stdout: response.data.stdout,
      stderr: response.data.stderr,
      compile_output: response.data.compile_output,
      status: response.data.status,
    };
  } catch (error) {
    console.error("Judge0 Error:", error.response?.data || error.message);
    throw error;
  }
}