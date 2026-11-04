import mongoose from "mongoose";
import { config } from "./config.js";

let isConnected = false;

export async function connectDB() {
  if (!config.mongodbUri) {
    console.log("[Database] No MONGODB_URI configured. Running with in-memory persistence fallback for local development.");
    return false;
  }

  try {
    // 5-second timeout for MongoDB connection attempts
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("[Database] Connected successfully to MongoDB via Mongoose.");
    return true;
  } catch (error) {
    console.warn(`[Database] MongoDB connection failed (${error.message}). Falling back to local in-memory persistence.`);
    isConnected = false;
    return false;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
