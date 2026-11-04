import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Helper to get or initialize persistent guest ID
export const getOrCreateGuestId = () => {
  let guestId = localStorage.getItem("cr_guest_id");
  if (!guestId) {
    guestId = `guest_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    localStorage.setItem("cr_guest_id", guestId);
  }
  return guestId;
};

// Attach JWT token or guest ID to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("cr_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    config.headers["x-guest-id"] = getOrCreateGuestId();
  }
  return config;
});

// Interceptor to format errors consistently
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data?.error || {
      code: "NETWORK_ERROR",
      message: error.message || "Failed to communicate with server.",
    };
    return Promise.reject(apiError);
  }
);

// ─── Code execution / review / verification ──────────────────────────────────
export const runCode = async (code, language, languageId, stdin = "") => {
  const response = await API.post("/run", { code, language, languageId, stdin });
  return response.data;
};

export const runBatchTests = async (code, language, languageId, testCases, concurrency = 3) => {
  const response = await API.post("/run-tests", {
    code,
    language,
    languageId,
    testCases,
    concurrency,
  });
  return response.data;
};

export const reviewCode = async (code, language, model = null) => {
  const response = await API.post("/review", { code, language, model });
  return response.data;
};

export const generateRegressionTests = async (code, language, findings = []) => {
  const response = await API.post("/generate-tests", { code, language, findings });
  return response.data;
};

export const verifyFixes = async (payload) => {
  const response = await API.post("/verify", payload);
  return response.data;
};

export const chatWithAI = async (question, code, language, model = null) => {
  const response = await API.post("/chat", { question, code, language, model });
  return response.data;
};

export const getQuota = async () => {
  const response = await API.get("/quota");
  return response.data;
};

// ─── Sessions ────────────────────────────────────────────────────────────────
export const saveSession = async (sessionData) => {
  const response = await API.post("/sessions", sessionData);
  return response.data;
};

export const getSessions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.language) params.append("language", filters.language);
  if (filters.severity) params.append("severity", filters.severity);
  if (filters.category) params.append("category", filters.category);
  if (filters.limit) params.append("limit", filters.limit);

  const response = await API.get(`/sessions?${params.toString()}`);
  return response.data;
};

export const getSessionById = async (sessionId) => {
  const response = await API.get(`/sessions/${sessionId}`);
  return response.data;
};

export const updateSession = async (sessionId, updates) => {
  const response = await API.put(`/sessions/${sessionId}`, updates);
  return response.data;
};

export const deleteSession = async (sessionId) => {
  const response = await API.delete(`/sessions/${sessionId}`);
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

export default API;