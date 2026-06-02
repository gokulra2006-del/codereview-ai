import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const runCode = async (code, language, languageId, stdin = "") => {
  const response = await API.post("/run", { code, language, languageId, stdin });
  return response.data;
};

export const reviewCode = async (code, language) => {
  const response = await API.post("/review", { code, language });
  return response.data;
};

// ✅ NEW
export const chatWithAI = async (question, code, language) => {
  const response = await API.post("/chat", { question, code, language });
  return response.data;
};