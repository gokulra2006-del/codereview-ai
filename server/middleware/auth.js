import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { ApiError } from "./errors.js";

export const verifyToken = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "UNAUTHORIZED", "Authentication required. Please log in."));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (_err) {
    return next(new ApiError(401, "INVALID_TOKEN", "Session expired or invalid token. Please log in again."));
  }
};

export const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
  } catch {
    // Ignore invalid token for optional auth, treat as guest
  }
  next();
};
