import { Router } from "express";
import {
  createSession,
  getSessionById,
  getUserSessions,
  updateSession,
  deleteSession,
} from "../models/ReviewSession.js";
import { optionalAuth, verifyToken } from "../middleware/auth.js";
import { getClientIdentifier } from "../middleware/quota.js";
import { ApiError } from "../middleware/errors.js";

const router = Router();

// GET /api/sessions - List sessions for user (or guest identifier)
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : getClientIdentifier(req);
    const filters = {
      language: req.query.language,
      category: req.query.category,
      severity: req.query.severity,
      limit: req.query.limit || 50,
    };

    const sessions = await getUserSessions(userId, filters);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions - Save new review session
router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : getClientIdentifier(req);
    const {
      language,
      originalCode,
      currentCode,
      originalScore,
      finalScore,
      structuredFindings,
      acceptedFixes,
      rejectedFixes,
      tests,
      verificationResults,
    } = req.body || {};

    if (!originalCode || !language) {
      return next(new ApiError(400, "VALIDATION_ERROR", "originalCode and language are required to save a session."));
    }

    const session = await createSession({
      userId,
      language,
      originalCode,
      currentCode: currentCode || originalCode,
      originalScore: originalScore || 0,
      finalScore: finalScore || originalScore || 0,
      structuredFindings: structuredFindings || {},
      acceptedFixes: acceptedFixes || [],
      rejectedFixes: rejectedFixes || [],
      tests: tests || [],
      verificationResults: verificationResults || null,
      status: verificationResults?.verified ? "verified" : "active",
    });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:sessionId - Get specific session
router.get("/:sessionId", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : getClientIdentifier(req);
    const session = await getSessionById(req.params.sessionId, userId);
    if (!session) {
      return next(new ApiError(404, "SESSION_NOT_FOUND", "Review session not found."));
    }
    res.json({ session });
  } catch (err) {
    next(err);
  }
});

// PUT /api/sessions/:sessionId - Update session
router.put("/:sessionId", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : getClientIdentifier(req);
    const updated = await updateSession(req.params.sessionId, req.body, userId);
    if (!updated) {
      return next(new ApiError(404, "SESSION_NOT_FOUND", "Review session not found or update unauthorized."));
    }
    res.json({ session: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sessions/:sessionId - Delete session
router.delete("/:sessionId", verifyToken, async (req, res, next) => {
  try {
    const success = await deleteSession(req.params.sessionId, req.user.id);
    if (!success) {
      return next(new ApiError(404, "SESSION_NOT_FOUND", "Review session not found or deletion unauthorized."));
    }
    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
