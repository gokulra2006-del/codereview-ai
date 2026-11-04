import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env or server/.env
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, ".env") });

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev_jwt_secret_key_1234567890"),
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  mongodbUri: process.env.MONGODB_URI || process.env.MONGO_URI || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  maxCodeLength: parseInt(process.env.MAX_CODE_LENGTH || "50000", 10),
  maxQuestionLength: parseInt(process.env.MAX_QUESTION_LENGTH || "2000", 10),
  maxStdinLength: parseInt(process.env.MAX_STDIN_LENGTH || "10000", 10),
  maxTestCases: parseInt(process.env.MAX_TEST_CASES || "15", 10),
  judge0BaseUrl: process.env.JUDGE0_BASE_URL || "https://ce.judge0.com",
};

export function validateEnvironment() {
  const issues = [];
  const status = [];

  if (!config.jwtSecret) {
    issues.push("JWT_SECRET is missing or empty.");
    status.push("JWT_SECRET: MISSING");
  } else {
    status.push(`JWT_SECRET: configured (${config.jwtSecret.length} chars)`);
  }

  if (!config.openrouterApiKey) {
    status.push("OPENROUTER_API_KEY: NOT SET (AI features will return simulated/degraded errors)");
  } else {
    status.push(`OPENROUTER_API_KEY: configured (length: ${config.openrouterApiKey.length})`);
  }

  if (!config.mongodbUri) {
    status.push("MONGODB_URI: NOT SET (using in-memory fallback persistence for local development)");
  } else {
    status.push("MONGODB_URI: configured");
  }

  status.push(`CORS_ORIGIN: ${config.corsOrigin}`);
  status.push(`PORT: ${config.port}`);
  status.push(`NODE_ENV: ${config.nodeEnv}`);

  console.log("=== Environment Validation ===");
  status.forEach((msg) => console.log(`  [Config] ${msg}`));
  console.log("===============================");

  if (config.nodeEnv === "production" && issues.length > 0) {
    throw new Error(`Fatal server configuration error: ${issues.join("; ")}`);
  }
}
