import express from "express";
import cors from "cors";
import { config, validateEnvironment } from "./config.js";
import { connectDB } from "./db.js";
import authRouter from "./routes/auth.js";
import sessionRouter from "./routes/sessions.js";
import { verifyToken, optionalAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import {
  generalLimiter,
  aiLimiter,
  runLimiter,
} from "./middleware/rateLimiter.js";
import {
  validateReview,
  validateRun,
  validateChat,
  validateTestCases,
} from "./middleware/validation.js";
import {
  enforceQuota,
  recordUsage,
  getQuotaInfo,
  getClientIdentifier,
} from "./middleware/quota.js";
import {
  reviewCode,
  chatWithAI,
  generateFocusedRegressionTests,
} from "./services/openrouter.js";
import {
  executeCode,
  executeTestCasesConcurrently,
  LANGUAGE_MAP,
} from "./services/judge0.js";
import { verifyPatches } from "./services/verification.js";
import { addHistory, getHistoryByUserId } from "./models/History.js";
import { incrementReview, incrementRun } from "./models/User.js";

// Validate env vars safely on startup
validateEnvironment();
connectDB().catch((err) => console.error("[Database Connection Error]", err.message));

const app = express();

// Security and CORS configuration
const corsOrigin =
  config.corsOrigin === "*"
    ? true
    : config.corsOrigin.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(generalLimiter);

// Health check
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "Verified CodeReview AI Workspace API",
    version: "2.0.0",
  });
});

// Quota status endpoint
app.get("/api/quota", optionalAuth, (req, res) => {
  const quota = getQuotaInfo(req);
  res.json({ quota });
});

// Auth routes
app.use("/api/auth", authRouter);

// Session routes
app.use("/api/sessions", sessionRouter);

// 1. Review route (Structured Output with Repair & Server Quotas)
app.post(
  "/api/review",
  aiLimiter,
  optionalAuth,
  enforceQuota("review"),
  validateReview,
  async (req, res, next) => {
    try {
      const { code, language, model } = req.body;
      const review = await reviewCode(code, language, model);

      // Record quota usage
      const clientId = getClientIdentifier(req);
      recordUsage(clientId, "review");

      // Save to history if user is logged in
      if (req.user) {
        await addHistory({
          userId: req.user.id,
          type: "review",
          language,
          code,
          result: review,
        });
        await incrementReview(req.user.id);
      }

      res.json({ review });
    } catch (error) {
      next(error);
    }
  }
);

// 2. Run single code execution route
app.post(
  "/api/run",
  runLimiter,
  optionalAuth,
  enforceQuota("run"),
  validateRun,
  async (req, res, next) => {
    try {
      const { code, languageId, stdin, language } = req.body;
      const resolvedLangId = languageId || (language ? LANGUAGE_MAP[language] : null);

      const result = await executeCode(code, resolvedLangId, stdin || "");

      // Record quota usage
      const clientId = getClientIdentifier(req);
      recordUsage(clientId, "run");

      // Save to history if logged in
      if (req.user) {
        await addHistory({
          userId: req.user.id,
          type: "run",
          language: language || "unknown",
          code,
          result:
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "Executed",
        });
        await incrementRun(req.user.id);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// 3. Batch concurrent test cases runner
app.post(
  "/api/run-tests",
  runLimiter,
  optionalAuth,
  enforceQuota("run"),
  validateTestCases,
  async (req, res, next) => {
    try {
      const { code, language, languageId, testCases, concurrency } = req.body;
      const resolvedLangId = languageId || (language ? LANGUAGE_MAP[language] : null);

      const report = await executeTestCasesConcurrently(
        code,
        resolvedLangId,
        testCases,
        concurrency || 3
      );

      // Record quota usage
      const clientId = getClientIdentifier(req);
      recordUsage(clientId, "run");

      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

// 4. Generate AI regression test cases based on findings
app.post(
  "/api/generate-tests",
  aiLimiter,
  optionalAuth,
  async (req, res, next) => {
    try {
      const { code, language, findings } = req.body;
      if (!code || !language) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "code and language are required to generate regression tests.",
          },
        });
      }

      const tests = await generateFocusedRegressionTests(code, language, findings || []);
      res.json({ tests });
    } catch (error) {
      next(error);
    }
  }
);

// 5. Verify fixes engine endpoint
app.post(
  "/api/verify",
  runLimiter,
  optionalAuth,
  async (req, res, next) => {
    try {
      const {
        originalCode,
        patchedCode,
        language,
        findings,
        acceptedFixes,
        approvedTests,
        originalScore,
      } = req.body;

      if (!patchedCode || !language) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "patchedCode and language are required for verification.",
          },
        });
      }

      const report = await verifyPatches({
        originalCode: originalCode || patchedCode,
        patchedCode,
        language,
        findings: findings || [],
        acceptedFixes: acceptedFixes || [],
        approvedTests: approvedTests || [],
        originalScore: originalScore || 70,
      });

      // Save to history if logged in
      if (req.user) {
        await addHistory({
          userId: req.user.id,
          type: "verify",
          language,
          code: patchedCode,
          result: report,
        });
      }

      res.json({ verification: report });
    } catch (error) {
      next(error);
    }
  }
);

// 6. User History route
app.get("/api/history", verifyToken, async (req, res, next) => {
  try {
    const history = await getHistoryByUserId(req.user.id);
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

// 7. AI Chat assistant
app.post(
  "/api/chat",
  aiLimiter,
  validateChat,
  async (req, res, next) => {
    try {
      const { question, code, language, model } = req.body;
      const reply = await chatWithAI(question, code, language, model);
      res.json({ reply });
    } catch (error) {
      next(error);
    }
  }
);

// 404 and Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start standalone server when executed directly (or non-production)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`🚀 Verified CodeReview Backend running on http://localhost:${PORT}`);
  });
}

export default app;