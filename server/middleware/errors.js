export class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(err, _req, res, _next) {
  // Determine status and error code
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";

  // Safe message: don't leak stack traces or internals on 500
  let message = err.message || "An unexpected error occurred.";
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "An unexpected server error occurred. Please try again later.";
  }

  // Never expose credentials, tokens, or raw system dumps in response
  const response = {
    error: {
      code,
      message,
    },
  };

  if (err.details && Array.isArray(err.details)) {
    response.error.details = err.details;
  } else if (err.details && typeof err.details === "object") {
    response.error.details = err.details;
  }

  if (statusCode >= 500) {
    console.error(`[Server Error] [${code}]`, err.message);
  }

  res.status(statusCode).json(response);
}
