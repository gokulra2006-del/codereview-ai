import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { isMongoConnected } from "../db.js";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  createdAt: { type: Date, default: Date.now },
  reviewCount: { type: Number, default: 0 },
  runCount: { type: Number, default: 0 },
});

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

// In-memory fallback repository for local development when MongoDB is not running
const fallbackUsers = new Map();

export async function findByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  if (isMongoConnected()) {
    const user = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (!user) return null;
    return { ...user, id: user._id.toString() };
  }
  const user = fallbackUsers.get(normalizedEmail);
  return user ? { ...user } : null;
}

export async function findById(id) {
  if (isMongoConnected()) {
    try {
      const user = await UserModel.findById(id).lean();
      if (!user) return null;
      return { ...user, id: user._id.toString() };
    } catch {
      return null;
    }
  }
  for (const user of fallbackUsers.values()) {
    if (user.id === id) return { ...user };
  }
  return null;
}

export async function createUser({ name, email, hashedPassword, plan = "free" }) {
  const normalizedEmail = email.toLowerCase().trim();

  if (isMongoConnected()) {
    const newUser = await UserModel.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      plan,
    });
    return {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      plan: newUser.plan,
      createdAt: newUser.createdAt,
      reviewCount: newUser.reviewCount,
      runCount: newUser.runCount,
    };
  }

  const user = {
    id: randomUUID(),
    name,
    email: normalizedEmail,
    password: hashedPassword,
    plan,
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    runCount: 0,
  };
  fallbackUsers.set(normalizedEmail, user);
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

export async function incrementReview(id) {
  if (isMongoConnected()) {
    await UserModel.findByIdAndUpdate(id, { $inc: { reviewCount: 1 } });
    return;
  }
  for (const user of fallbackUsers.values()) {
    if (user.id === id) {
      user.reviewCount = (user.reviewCount || 0) + 1;
      break;
    }
  }
}

export async function incrementRun(id) {
  if (isMongoConnected()) {
    await UserModel.findByIdAndUpdate(id, { $inc: { runCount: 1 } });
    return;
  }
  for (const user of fallbackUsers.values()) {
    if (user.id === id) {
      user.runCount = (user.runCount || 0) + 1;
      break;
    }
  }
}
