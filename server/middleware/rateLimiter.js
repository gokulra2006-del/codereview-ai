import rateLimit from "express-rate-limit";

const errorGenerator = (code, message) => (req, res) => {
  res.status(429).json({
    error: {
      code,
      message,
    },
  });
};

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: errorGenerator("RATE_LIMIT_EXCEEDED", "Too many requests. Please slow down."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: errorGenerator("AUTH_RATE_LIMIT_EXCEEDED", "Too many authentication attempts. Please try again in 15 minutes."),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: errorGenerator("AI_RATE_LIMIT_EXCEEDED", "Too many AI review/chat requests. Please wait a moment before trying again."),
});

export const runLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: errorGenerator("EXECUTION_RATE_LIMIT_EXCEEDED", "Execution rate limit reached. Please wait a moment before running more code."),
});
