import { ApiError } from "./errors.js";

// In-memory tracker keyed by identifier (userId or guest-IP/guest-token)
// Format: { [key]: { date: "YYYY-MM-DD", reviews: 0, runs: 0 } }
const usageStore = new Map();

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const LIMITS = {
  guest: { reviews: 5, runs: 10 },
  free: { reviews: 30, runs: 60 },
  pro: { reviews: Infinity, runs: Infinity },
};

export function getClientIdentifier(req) {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  const guestHeader = req.headers["x-guest-id"];
  if (guestHeader && typeof guestHeader === "string" && guestHeader.length < 64) {
    return `guest:${guestHeader.trim()}`;
  }
  const ip = req.ip || req.socket?.remoteAddress || "127.0.0.1";
  return `ip:${ip}`;
}

export function getUserPlan(req) {
  if (!req.user) return "guest";
  return req.user.plan || "free";
}

export function getUsage(identifier) {
  const today = getTodayKey();
  let record = usageStore.get(identifier);
  if (!record || record.date !== today) {
    record = { date: today, reviews: 0, runs: 0 };
    usageStore.set(identifier, record);
  }
  return record;
}

export function recordUsage(identifier, type) {
  const record = getUsage(identifier);
  if (type === "review") record.reviews += 1;
  if (type === "run") record.runs += 1;
}

export function getQuotaInfo(req) {
  const identifier = getClientIdentifier(req);
  const plan = getUserPlan(req);
  const usage = getUsage(identifier);
  const limit = LIMITS[plan] || LIMITS.guest;

  const reviewsRemaining = limit.reviews === Infinity ? Infinity : Math.max(0, limit.reviews - usage.reviews);
  const runsRemaining = limit.runs === Infinity ? Infinity : Math.max(0, limit.runs - usage.runs);

  return {
    plan,
    isGuest: !req.user,
    reviews: {
      used: usage.reviews,
      limit: limit.reviews === Infinity ? "unlimited" : limit.reviews,
      remaining: limit.reviews === Infinity ? "unlimited" : reviewsRemaining,
    },
    runs: {
      used: usage.runs,
      limit: limit.runs === Infinity ? "unlimited" : limit.runs,
      remaining: limit.runs === Infinity ? "unlimited" : runsRemaining,
    },
    resetsAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
  };
}

export function enforceQuota(action) {
  return (req, _res, next) => {
    const identifier = getClientIdentifier(req);
    const plan = getUserPlan(req);
    const usage = getUsage(identifier);
    const limit = LIMITS[plan] || LIMITS.guest;

    if (action === "review") {
      if (limit.reviews !== Infinity && usage.reviews >= limit.reviews) {
        const msg = plan === "guest"
          ? "You have reached your daily guest review limit (5 reviews). Create a free account for higher limits!"
          : "You have reached your daily review limit (30 reviews).";
        return next(new ApiError(429, "QUOTA_EXCEEDED", msg, {
          action: "review",
          limit: limit.reviews,
          plan,
        }));
      }
    } else if (action === "run") {
      if (limit.runs !== Infinity && usage.runs >= limit.runs) {
        const msg = plan === "guest"
          ? "You have reached your daily guest execution limit (10 runs). Create a free account for higher limits!"
          : "You have reached your daily code execution limit (60 runs).";
        return next(new ApiError(429, "QUOTA_EXCEEDED", msg, {
          action: "run",
          limit: limit.runs,
          plan,
        }));
      }
    }

    next();
  };
}
