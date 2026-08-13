<div align="center">
  <h1>AI Code Review Assistant</h1>
  <p><em>An intelligent developer productivity tool for automated code reviews.</em></p>

  <p>
    <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
  </p>

  <h3>
    <a href="#live-demo">Live Demo</a>
    <span> | </span>
    <a href="https://github.com/gokulra2006-del/codereview-ai">Repository</a>
  </h3>
</div>

---

## 📖 Overview

This project is an AI-powered Code Review Assistant that leverages advanced Large Language Models (LLMs) via OpenRouter to analyze code, suggest improvements, and detect potential bugs. It is built using a modern React frontend with Monaco Editor integration and a Node.js/Express backend.

## ✨ Key Features

- **Automated Code Analysis**: Submit code snippets for instant AI-driven reviews.
- **Syntax Highlighting**: Integrated Monaco Editor for a native IDE-like experience.
- **User Authentication**: Secure JWT-based authentication for user sessions.
- **Review History**: Persist and browse past code reviews.
- **Markdown Support**: Beautifully rendered Markdown responses from the AI.

## 🛠 Tech Stack

| Category | Technologies |
| --- | --- |
| **Frontend** | React, Vite, Monaco Editor, Tailwind CSS (Lucide React) |
| **Backend** | Node.js, Express.js |
| **Authentication** | JWT, bcryptjs |
| **AI/Tools** | OpenRouter APIs, Axios |

## 🏗 Architecture & Directory Structure

```text
├── server/               # Node.js/Express backend
│   ├── middleware/       # JWT Auth Middleware
│   ├── routes/           # Authentication & API routes
│   ├── services/         # OpenRouter API integration
│   ├── models/           # Data models (User, History)
│   └── index.js          # Backend entry point
├── src/                  # React frontend client
│   ├── services/         # Frontend API integrations
│   └── ...               # React Components and Pages
├── package.json          # Frontend dependencies (Vite)
└── README.md
```

## 🚀 Quick Start (Local Installation)

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v18+)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gokulra2006-del/codereview-ai.git
   cd codereview-ai
   ```

2. **Setup the Backend:**
   ```bash
   cd server
   npm install
   ```
   *Create a `.env` file in the `server` directory based on `server/.env.example`.*
   ```bash
   npm run start
   ```

3. **Setup the Frontend:**
   ```bash
   cd .. # Back to root
   npm install
   ```
   *Create a `.env` file in the root directory based on `.env.example`.*
   ```bash
   npm run dev
   ```

## 🔐 Environment Variables

Refer to the `.env.example` file in the `server` directory for a complete list of required environment variables for the OpenRouter AI integration and JWT secrets.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📜 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.

## 👤 Author
**Gokul R**
- LinkedIn: [Gokul Ramachandran](https://www.linkedin.com/in/gokul-ramachandran-513299327/)
- GitHub: [@gokulra2006-del](https://github.com/gokulra2006-del)
