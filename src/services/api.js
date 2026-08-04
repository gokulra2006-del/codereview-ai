// src/services/api.js  ← FRONTEND ONLY
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach JWT token from localStorage to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("cr_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Code execution / review ────────────────────────────────────────────────
export const runCode = async (code, language, languageId, stdin = "") => {
  const response = await API.post("/run", { code, language, languageId, stdin });
  return response.data;
};

export const reviewCode = async (code, language, model) => {
  const response = await API.post("/review", { code, language, model });
  return response.data;
};

export const chatWithAI = async (question, code, language, model) => {
  const response = await API.post("/chat", { question, code, language, model });
  return response.data;
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const signupUser = async ({ name, email, password }) => {
  const response = await API.post("/auth/signup", { name, email, password });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await API.post("/auth/login", { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await API.get("/auth/me");
  return response.data;
};

export const getHistory = async () => {
  const response = await API.get("/history");
  return response.data;
};