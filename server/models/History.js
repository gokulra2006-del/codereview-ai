import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "..", "data");
const HISTORY_FILE = join(DATA_DIR, "history.json");

// Ensure data directory and file exist
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(HISTORY_FILE)) writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));

const readHistory = () => {
  try {
    return JSON.parse(readFileSync(HISTORY_FILE, "utf-8"));
  } catch {
    return [];
  }
};

const writeHistory = (history) => {
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
};

export const getHistoryByUserId = (userId) => {
  const history = readHistory();
  return history.filter((h) => h.userId === userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const addHistory = ({ userId, type, language, code, result }) => {
  const history = readHistory();
  const newEntry = {
    id: randomUUID(),
    userId,
    type, // 'run' or 'review'
    language,
    code,
    result,
    timestamp: new Date().toISOString(),
  };
  history.push(newEntry);
  writeHistory(history);
  return newEntry;
};
