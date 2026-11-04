import { ApiError } from "./errors.js";
import { config } from "../config.js";

const ALLOWED_LANGUAGES = ["cpp", "python", "java", "javascript"];

export function validateSignup(req, _res, next) {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Name is required and must be text.");
  } else if (name.trim().length > 100) {
    errors.push("Name cannot exceed 100 characters.");
  }

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  } else if (password.length > 128) {
    errors.push("Password cannot exceed 128 characters.");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "VALIDATION_ERROR", "Invalid signup details provided.", errors));
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

export function validateLogin(req, _res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required.");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "VALIDATION_ERROR", "Invalid login credentials provided.", errors));
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

export function validateReview(req, _res, next) {
  const { code, language } = req.body || {};
  const errors = [];

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    errors.push("Code content is required.");
  } else if (code.length > config.maxCodeLength) {
    errors.push(`Code exceeds maximum allowed limit of ${config.maxCodeLength} characters.`);
  }

  if (!language || typeof language !== "string" || !ALLOWED_LANGUAGES.includes(language.toLowerCase())) {
    errors.push(`Language must be one of: ${ALLOWED_LANGUAGES.join(", ")}.`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "VALIDATION_ERROR", "Invalid review request payload.", errors));
  }

  req.body.language = language.toLowerCase();
  next();
}

export function validateRun(req, _res, next) {
  const { code, language, stdin } = req.body || {};
  const errors = [];

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    errors.push("Code content is required.");
  } else if (code.length > config.maxCodeLength) {
    errors.push(`Code exceeds maximum allowed limit of ${config.maxCodeLength} characters.`);
  }

  if (language && (typeof language !== "string" || !ALLOWED_LANGUAGES.includes(language.toLowerCase()))) {
    errors.push(`Language must be one of: ${ALLOWED_LANGUAGES.join(", ")}.`);
  }

  if (stdin !== undefined && stdin !== null) {
    if (typeof stdin !== "string") {
      errors.push("stdin must be a string.");
    } else if (stdin.length > config.maxStdinLength) {
      errors.push(`stdin exceeds maximum allowed limit of ${config.maxStdinLength} characters.`);
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "VALIDATION_ERROR", "Invalid code run request payload.", errors));
  }

  if (language) req.body.language = language.toLowerCase();
  next();
}

export function validateChat(req, _res, next) {
  const { question, code, language } = req.body || {};
  const errors = [];

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    errors.push("Question is required.");
  } else if (question.length > config.maxQuestionLength) {
    errors.push(`Question exceeds maximum allowed limit of ${config.maxQuestionLength} characters.`);
  }

  if (code && typeof code === "string" && code.length > config.maxCodeLength) {
    errors.push(`Code exceeds maximum allowed limit of ${config.maxCodeLength} characters.`);
  }

  if (language && (typeof language !== "string" || !ALLOWED_LANGUAGES.includes(language.toLowerCase()))) {
    errors.push(`Language must be one of: ${ALLOWED_LANGUAGES.join(", ")}.`);
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "VALIDATION_ERROR", "Invalid chat request payload.", errors));
  }

  req.body.question = question.trim();
  if (language) req.body.language = language.toLowerCase();
  next();
}

export function validateTestCases(req, _res, next) {
  const { testCases, code, language } = req.body || {};
  const errors = [];

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    errors.push("Code is required to execute tests.");
  } else if (code.length > config.maxCodeLength) {
    errors.push(`Code exceeds maximum allowed limit of ${config.maxCodeLength} characters.`);
  }

  if (!Array.isArray(testCases)) {
    errors.push("testCases must be an array.");
  } else if (testCases.length > config.maxTestCases) {
    errors.push(`Maximum of ${config.maxTestCases} test cases allowed per run.`);
  } else {
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      if (typeof tc !== "object" || tc === null) {
        errors.push(`Test case #${i + 1} must be an object.`);
        break;
      }
      if (tc.input && typeof tc.input === "string" && tc.input.length > config.maxStdinLength) {
        errors.push(`Test case #${i + 1} input exceeds maximum length.`);
      }
      if (tc.expectedOutput && typeof tc.expectedOutput === "string" && tc.expectedOutput.length > config.maxStdinLength) {
        errors.push(`Test case #${i + 1} expectedOutput exceeds maximum length.`);
      }
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "VALIDATION_ERROR", "Invalid test cases provided.", errors));
  }

  if (language) req.body.language = language.toLowerCase();
  next();
}
