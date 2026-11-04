import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findByEmail, findById, createUser } from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import { validateSignup, validateLogin } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { ApiError } from "../middleware/errors.js";
import { config } from "../config.js";

const router = Router();

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan || "free",
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );

// POST /api/auth/signup
router.post("/signup", authLimiter, validateSignup, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await findByEmail(email);
    if (existing) {
      return next(new ApiError(409, "USER_EXISTS", "An account with this email already exists."));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await createUser({ name, email, hashedPassword, plan: "free" });
    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan || "free",
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await findByEmail(email);
    if (!user) {
      return next(new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password."));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password."));
    }

    const token = signToken(user);
    const { password: _pw, ...safeUser } = user;

    res.json({
      token,
      user: {
        id: safeUser.id,
        name: safeUser.name,
        email: safeUser.email,
        plan: safeUser.plan || "free",
        createdAt: safeUser.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const user = await findById(req.user.id);
    if (!user) {
      return next(new ApiError(404, "USER_NOT_FOUND", "User profile not found."));
    }
    const { password: _pw, ...safeUser } = user;
    res.json({
      user: {
        id: safeUser.id,
        name: safeUser.name,
        email: safeUser.email,
        plan: safeUser.plan || "free",
        createdAt: safeUser.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
