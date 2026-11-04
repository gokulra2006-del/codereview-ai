# Verified AI Code Review Workspace

A production-quality **Verified AI Code Review Workspace** featuring automated structured static analysis, Monaco Editor diff inspection, one-click patch application with undo, AI regression test generation, Judge0 execution verification, and persisted review sessions.

---

## 🌟 Flagship Features

### 1. Verified Fix Loop
- **Structured Schema Reviews**: Every review outputs validated JSON including:
  - Concise summary & overall score (0–100)
  - Detailed findings: Category, severity, confidence, exact 1-indexed start/end lines, suggested replacement, explanation, and estimated impact
  - Positive observations
- **Model Output Repair**: Automatic server-side schema normalization and one-shot repair loop for invalid LLM responses.
- **Visual Finding Cards & Monaco Highlights**: Selecting any issue card automatically scrolls the Monaco Editor and highlights the targeted source code lines.
- **Diff Preview & Patch Application**:
  - Side-by-side or inline Monaco Diff preview before applying changes.
  - Conflict detection: Rejects patches if the targeted lines have been edited or shifted since the review.
  - Full Undo support: Roll back applied fixes at any time with one click or `Ctrl+Z`.

### 2. Verification Engine
- **Focused Regression Tests**: Generates targeted unit tests addressing the identified issues.
- **Concurrent Test Execution**: Executes approved tests via Judge0 with configurable concurrency pool limits.
- **Behavior Delta Analysis**: Compares test outcomes before and after patches.
- **Verification Confidence**: Produces an empirical verification report grounded in execution results.

### 3. Review Sessions & Dashboard
- **Session Persistence**: Saves original code, patched code, structured findings, accepted fixes, regression tests, and verification reports.
- **Analytical Dashboard**: Shows quality score gains over time, issue breakdowns by severity/category, test pass rates, most improved languages, and one-click session reopening.
- **Mongoose / In-Memory Fallback**: Seamlessly uses MongoDB when `MONGODB_URI` is present; falls back to an in-memory repository for instant offline or local development.

### 4. Enterprise Security & Quota Enforcement
- **Server-Side Quota Enforcement**: Tracks guest and authenticated quotas by IP / token. Prevents quota bypass.
- **Multi-Tier Rate Limiting**: Dedicated rate limiters for authentication, AI inference, and execution.
- **Safe Error Formatter**: All responses follow `{ error: { code, message, details? } }` without exposing API keys, stack traces, password hashes, or provider error bodies.
- **Input Validation**: Strict maximum lengths on code (50KB), stdin, questions, and test cases.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite 8, Monaco Editor (`@monaco-editor/react`), Lucide React, React Hot Toast, React Router 7.
- **Backend**: Node.js, Express 5, Mongoose 9, JWT, bcryptjs, Axios, express-rate-limit.
- **Testing**: Vitest, Supertest.
- **Integrations**: OpenRouter LLM API, Judge0 Code Execution API.

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/gokulra2006-del/codereview-ai.git
cd codereview-ai
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
```env
PORT=5000
VITE_API_URL=http://localhost:5000/api
JWT_SECRET=your_super_secret_jwt_key_at_least_16_chars_long
OPENROUTER_API_KEY=your_openrouter_api_key
MONGODB_URI=mongodb://localhost:27017/codereview-ai   # Optional for local dev
```

### 3. Run Development Servers
- **Backend API**:
  ```bash
  npm run server
  ```
  Runs on `http://localhost:5000`

- **Frontend Client**:
  ```bash
  npm run dev
  ```
  Runs on `http://localhost:5173`

### 4. Run Automated Tests
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl + Enter` | Run code execution |
| `Ctrl + Shift + R` | Trigger Verified AI code review |
| `Ctrl + Shift + C` | Toggle AI Chat assistant |
| `Alt + Shift + F` | Format document in Monaco |
| `?` | Show keyboard shortcuts modal |
| `Esc` | Close active modals |
