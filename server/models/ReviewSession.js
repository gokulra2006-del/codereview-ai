import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { isMongoConnected } from "../db.js";

const ReviewSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  language: { type: String, required: true, index: true },
  originalCode: { type: String, required: true },
  currentCode: { type: String, required: true },
  originalScore: { type: Number, default: 0 },
  finalScore: { type: Number, default: 0 },
  structuredFindings: { type: mongoose.Schema.Types.Mixed, default: {} },
  acceptedFixes: { type: [String], default: [] },
  rejectedFixes: { type: [String], default: [] },
  tests: { type: [mongoose.Schema.Types.Mixed], default: [] },
  verificationResults: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, default: "active" }, // 'active', 'verified', 'archived'
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const ReviewSessionModel =
  mongoose.models.ReviewSession || mongoose.model("ReviewSession", ReviewSessionSchema);

// In-memory fallback
const fallbackSessions = new Map();

export async function createSession(data) {
  const sessionId = data.sessionId || randomUUID();
  const sessionData = {
    ...data,
    sessionId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isMongoConnected()) {
    const doc = await ReviewSessionModel.create(sessionData);
    return { ...doc.toObject(), id: doc._id.toString() };
  }

  fallbackSessions.set(sessionId, {
    ...sessionData,
    id: sessionId,
    createdAt: sessionData.createdAt.toISOString(),
    updatedAt: sessionData.updatedAt.toISOString(),
  });
  return fallbackSessions.get(sessionId);
}

export async function getSessionById(sessionId, userId = null) {
  if (isMongoConnected()) {
    const query = { sessionId };
    if (userId) query.userId = userId;
    const doc = await ReviewSessionModel.findOne(query).lean();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() };
  }

  const session = fallbackSessions.get(sessionId);
  if (!session) return null;
  if (userId && session.userId !== userId) return null;
  return { ...session };
}

export async function getUserSessions(userId, filters = {}) {
  const { language, severity, category, limit = 50 } = filters;

  if (isMongoConnected()) {
    const query = { userId };
    if (language) query.language = language;
    const docs = await ReviewSessionModel.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    let results = docs.map((d) => ({ ...d, id: d._id.toString() }));
    if (severity) {
      results = results.filter((s) =>
        s.structuredFindings?.issues?.some((i) => i.severity === severity)
      );
    }
    if (category) {
      results = results.filter((s) =>
        s.structuredFindings?.issues?.some((i) => i.category === category)
      );
    }
    return results;
  }

  let list = Array.from(fallbackSessions.values())
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (language) list = list.filter((s) => s.language === language);
  if (severity) {
    list = list.filter((s) =>
      s.structuredFindings?.issues?.some((i) => i.severity === severity)
    );
  }
  if (category) {
    list = list.filter((s) =>
      s.structuredFindings?.issues?.some((i) => i.category === category)
    );
  }

  return list.slice(0, parseInt(limit, 10));
}

export async function updateSession(sessionId, updates, userId = null) {
  const updateData = { ...updates, updatedAt: new Date() };

  if (isMongoConnected()) {
    const query = { sessionId };
    if (userId) query.userId = userId;
    const doc = await ReviewSessionModel.findOneAndUpdate(query, updateData, { new: true }).lean();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() };
  }

  const existing = fallbackSessions.get(sessionId);
  if (!existing) return null;
  if (userId && existing.userId !== userId) return null;

  const merged = {
    ...existing,
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  fallbackSessions.set(sessionId, merged);
  return { ...merged };
}

export async function deleteSession(sessionId, userId = null) {
  if (isMongoConnected()) {
    const query = { sessionId };
    if (userId) query.userId = userId;
    const res = await ReviewSessionModel.deleteOne(query);
    return res.deletedCount > 0;
  }

  const existing = fallbackSessions.get(sessionId);
  if (!existing) return false;
  if (userId && existing.userId !== userId) return false;
  return fallbackSessions.delete(sessionId);
}
