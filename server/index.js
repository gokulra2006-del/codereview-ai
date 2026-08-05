import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import { reviewCode } from "./services/openrouter.js";
import { executeCode } from "./services/judge0.js";
import authRouter from "./routes/auth.js";
import { verifyToken, optionalAuth } from "./middleware/auth.js";
import { addHistory, getHistoryByUserId } from "./models/History.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

console.log("Checking API Key setup...", process.env.OPENROUTER_API_KEY ? "Loaded Successfully" : "MISSING!");
console.log("JWT Secret:", process.env.JWT_SECRET ? "Loaded Successfully" : "MISSING!");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use(limiter);

app.get("/", (_req, res) => res.send("Backend Running"));

// Auth routes
app.use("/api/auth", authRouter);

// 1. Review route
app.post("/api/review", optionalAuth, async (req, res) => {
  try {
    const { code, language, model } = req.body;
    if (!code) return res.status(400).json({ error: "Code content is missing." });
    const review = await reviewCode(code, language, model);
    
    // Save history if user is logged in
    if (req.user) {
      addHistory({ userId: req.user.id, type: "review", language, code, result: review });
    }

    res.json({ review });
  } catch (error) {
    console.error("[Review Route Error]", error.message);
    res.status(500).json({ error: error.message || "Review failed" });
  }
});

// 2. Run route
app.post("/api/run", optionalAuth, async (req, res) => {
  try {
    const { code, languageId, stdin, language } = req.body; // get language string from frontend
    const result = await executeCode(code, languageId, stdin);
    
    // Save history if user is logged in
    if (req.user) {
      addHistory({ userId: req.user.id, type: "run", language: language || "unknown", code, result: result.stdout || result.stderr || result.compile_output || "Executed" });
    }

    res.json(result);
  } catch (error) {
    console.error("[Run Route Error]", error.message);
    res.status(500).json({ error: "Execution failed" });
  }
});

// 2.5 History route
app.get("/api/history", verifyToken, (req, res) => {
  try {
    const history = getHistoryByUserId(req.user.id);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// 3. Chat route
app.post("/api/chat", async (req, res) => {
  try {
    const { question, code, language, model: preferredModel } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "OpenRouter API Key is missing on the server." });
    }

    const CHAT_MODELS = [
      "google/gemini-2.0-flash-lite-preview-02-05:free",
      "google/gemini-2.0-pro-exp-02-05:free",
      "meta-llama/llama-3.3-70b-instruct",
      "google/gemma-3-27b-it",
      "qwen/qwen-2.5-coder-32b-instruct"
    ];

    let lastError = null;

    const chatModelsToTry = [...CHAT_MODELS];
    if (preferredModel && preferredModel !== "auto") {
      const index = chatModelsToTry.indexOf(preferredModel);
      if (index > -1) {
        chatModelsToTry.splice(index, 1);
      }
      chatModelsToTry.unshift(preferredModel);
    }

    for (const model of chatModelsToTry) {
      try {
        console.log(`[Chat] Trying model: ${model}`);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Code Review AI Project",
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            messages: [
              {
                role: "system",
                content: "You are an elite coding assistant. Provide the most detailed, thorough, and exhaustive answers possible. Explain all concepts, trade-offs, alternative approaches, and edge cases in depth. Provide full code examples, step-by-step breakdowns, and deep technical context. Use markdown formatting.",
              },
              {
                role: "user",
                content: `The user is working with this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nQuestion: ${question}`,
              },
            ],
          }),
        });

        const data = await response.json();

        if (data.error) {
          console.warn(`[Chat] Model ${model} failed:`, data.error.message);
          lastError = data.error.message;
          continue;
        }

        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          console.log(`✅ Chat reply from: ${model}`);
          res.json({ reply });
          return;
        }
      } catch (err) {
        console.warn(`[Chat] Model ${model} threw:`, err.message);
        lastError = err.message;
      }
    }

    res.status(500).json({ error: `All models failed. Last error: ${lastError}` });
  } catch (error) {
    console.error("[Chat Route Error]", error.message);
    res.status(500).json({ error: "Chat failed" });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;