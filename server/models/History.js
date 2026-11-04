import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { isMongoConnected } from "../db.js";

const HistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ["run", "review", "verify"], required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const HistoryModel = mongoose.models.History || mongoose.model("History", HistorySchema);

// In-memory fallback history entries
const fallbackHistory = [];

export async function getHistoryByUserId(userId) {
  if (isMongoConnected()) {
    const list = await HistoryModel.find({ userId }).sort({ timestamp: -1 }).lean();
    return list.map((item) => ({
      ...item,
      id: item._id.toString(),
    }));
  }

  return fallbackHistory
    .filter((h) => h.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function addHistory({ userId, type, language, code, result }) {
  if (isMongoConnected()) {
    const entry = await HistoryModel.create({
      userId,
      type,
      language,
      code,
      result,
      timestamp: new Date(),
    });
    return {
      ...entry.toObject(),
      id: entry._id.toString(),
    };
  }

  const newEntry = {
    id: randomUUID(),
    userId,
    type,
    language,
    code,
    result,
    timestamp: new Date().toISOString(),
  };
  fallbackHistory.push(newEntry);
  return newEntry;
}
