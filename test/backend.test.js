import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../server/index.js";
import { validateAndNormalizeReview } from "../server/services/openrouter.js";
import { verifyPatches } from "../server/services/verification.js";

describe("Backend API & Security Suite", () => {
  const testUser = {
    name: "Alex Developer",
    email: `alex_${Date.now()}@example.com`,
    password: "Password123!",
  };
  let authToken = "";

  it("Health check returns 200 with service info", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.version).toBe("2.0.0");
  });

  describe("Authentication & Security", () => {
    it("Rejects signup with weak password", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ name: "Alex", email: "alex_weak@example.com", password: "short" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("Successfully signs up new user and returns token + plan", async () => {
      const res = await request(app).post("/api/auth/signup").send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.plan).toBe("free");
      expect(res.body.user.password).toBeUndefined();
      authToken = res.body.token;
    });

    it("Rejects duplicate email registration with 409", async () => {
      const res = await request(app).post("/api/auth/signup").send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("USER_EXISTS");
    });

    it("Logs in with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.password).toBeUndefined();
    });

    it("Rejects login with invalid password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "WrongPassword!",
      });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("Protects /api/auth/me against missing or invalid token", async () => {
      const unauth = await request(app).get("/api/auth/me");
      expect(unauth.status).toBe(401);
      expect(unauth.body.error.code).toBe("UNAUTHORIZED");

      const badToken = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.value");
      expect(badToken.status).toBe(401);
      expect(badToken.body.error.code).toBe("INVALID_TOKEN");
    });

    it("Returns user profile with valid JWT token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.plan).toBe("free");
    });
  });

  describe("Request Validation & Quota Limits", () => {
    it("Validates code size limit on /api/review", async () => {
      const massiveCode = "x".repeat(60000); // Exceeds 50k limit
      const res = await request(app).post("/api/review").send({
        code: massiveCode,
        language: "javascript",
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("Rejects unsupported programming languages", async () => {
      const res = await request(app).post("/api/review").send({
        code: "print(1)",
        language: "brainfuck",
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("Returns quota status for client UI", async () => {
      const res = await request(app).get("/api/quota");
      expect(res.status).toBe(200);
      expect(res.body.quota).toBeDefined();
      expect(res.body.quota.reviews.limit).toBeDefined();
      expect(res.body.quota.runs.limit).toBeDefined();
    });
  });

  describe("Structured Review & Verification Logic", () => {
    it("Normalizes structured review schema and handles out-of-range line numbers", () => {
      const rawAiResponse = {
        summary: "Calculates sum of two integers.",
        overallScore: 88,
        issues: [
          {
            id: "iss-1",
            title: "Missing input validation",
            description: "No validation for integer overflow.",
            category: "bug",
            severity: "high",
            confidence: 0.9,
            startLine: 2,
            endLine: 4,
            suggestedReplacement: "int a = 0, b = 0;",
            explanation: "Initializes variables safely.",
          },
        ],
        positiveObservations: ["Clean syntax"],
      };

      const normalized = validateAndNormalizeReview(rawAiResponse, "int a, b;\ncin >> a >> b;\ncout << a + b;\nreturn 0;");
      expect(normalized.overallScore).toBe(88);
      expect(normalized.issues.length).toBe(1);
      expect(normalized.issues[0].category).toBe("bug");
      expect(normalized.issues[0].severity).toBe("high");
      expect(normalized.issues[0].startLine).toBe(2);
      expect(normalized.issues[0].endLine).toBe(4);
    });

    it("does not claim a fix is verified without executed regression tests", async () => {
      const originalCode = "int a, b; cin >> a >> b; cout << a + b;";
      const patchedCode = "int a = 0, b = 0; cin >> a >> b; cout << a + b;";
      const findings = [
        { id: "iss-1", title: "Uninitialized variables", severity: "high" },
        { id: "iss-2", title: "Performance note", severity: "low" },
      ];

      const report = await verifyPatches({
        originalCode,
        patchedCode,
        language: "cpp",
        findings,
        acceptedFixes: ["iss-1"],
        approvedTests: [],
        originalScore: 70,
      });

      expect(report.verified).toBe(false);
      expect(report.findingsFixed).toEqual([]);
      expect(report.findingsApplied[0].id).toBe("iss-1");
      expect(report.findingsStillPresent.length).toBe(1);
      expect(report.scoreAfter).toBe(report.scoreBefore);
    });
  });

  describe("Review Sessions Persistence", () => {
    let createdSessionId = "";

    it("Creates a persisted review session", async () => {
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          language: "javascript",
          originalCode: "console.log('original')",
          currentCode: "console.log('patched')",
          originalScore: 75,
          finalScore: 90,
          structuredFindings: { summary: "Test review", issues: [] },
          acceptedFixes: ["iss-1"],
        });

      expect(res.status).toBe(201);
      expect(res.body.session).toBeDefined();
      expect(res.body.session.sessionId).toBeDefined();
      createdSessionId = res.body.session.sessionId;
    });

    it("Retrieves the saved review session by ID", async () => {
      const res = await request(app)
        .get(`/api/sessions/${createdSessionId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.session.language).toBe("javascript");
      expect(res.body.session.finalScore).toBe(90);
    });

    it("Lists user review sessions with filtering", async () => {
      const res = await request(app)
        .get("/api/sessions?language=javascript")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.sessions)).toBe(true);
      expect(res.body.sessions.length).toBeGreaterThan(0);
    });
  });
});
