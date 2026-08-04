// server/api.js  ← BACKEND ONLY
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import { reviewCode } from "./services/openrouter.js";
import { executeCode } from "./services/judge0.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log("API KEY loaded:", process.env.OPENROUTER_API_KEY ? "Yes" : "NO!");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use(limiter);

app.get("/", (_req, res) => res.send("Backend Running"));

app.post("/api/review", async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: "Code and language required" });
    }
    const review = await reviewCode(code, language);
    res.json({ review });
  } catch (error) {
    console.error("[Review Error]", error.message);
    res.status(500).json({ error: "Review failed", details: error.message });
  }
});

app.post("/api/run", async (req, res) => {
  try {
    const { code, languageId, stdin } = req.body;
    const result = await executeCode(code, languageId, stdin);
    res.json(result);
  } catch (error) {
    console.error("[Run Error]", error.message);
    res.status(500).json({ error: "Execution failed" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { question, code, language } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Code Review AI",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful coding assistant. Answer clearly and concisely. Use markdown formatting.",
          },
          {
            role: "user",
            content: `The user is working with this ${language || 'unknown'} code:\n\n\`\`\`${language || ''}\n${code || ''}\n\`\`\`\n\nQuestion: ${question}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response received.";
    res.json({ reply });
  } catch (error) {
    console.error("[Chat Error]", error.message);
    res.status(500).json({ error: "Chat failed", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});