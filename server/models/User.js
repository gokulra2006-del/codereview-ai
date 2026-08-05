import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = process.env.NODE_ENV === "production" || process.env.VERCEL ? "/tmp/data" : join(__dirname, "..", "data");
const USERS_FILE = join(DATA_DIR, "users.json");

// Ensure data directory and file exist
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(USERS_FILE)) writeFileSync(USERS_FILE, JSON.stringify([], null, 2));

const readUsers = () => {
  try {
    return JSON.parse(readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

export const findByEmail = (email) => {
  const users = readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
};

export const findById = (id) => {
  const users = readUsers();
  return users.find((u) => u.id === id) || null;
};

export const createUser = ({ name, email, hashedPassword }) => {
  const users = readUsers();
  const newUser = {
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    runCount: 0,
  };
  users.push(newUser);
  writeUsers(users);
  // Return user without password
  const { password, ...safeUser } = newUser;
  return safeUser;
};

export const incrementReview = (id) => {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx].reviewCount = (users[idx].reviewCount || 0) + 1;
    writeUsers(users);
  }
};

export const incrementRun = (id) => {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx].runCount = (users[idx].runCount || 0) + 1;
    writeUsers(users);
  }
};
