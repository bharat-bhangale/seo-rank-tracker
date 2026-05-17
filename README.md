# SEO Rank Tracker

A production-grade, full-stack AI-powered SEO Rank Tracker SaaS built with the **MERN stack** (MongoDB, Express, React, Node.js), **TypeScript**, and **Gemini AI**.

## Features

- 🔐 JWT Authentication with refresh token rotation
- 📊 SEO Analysis Engine with AI-powered reports
- 📈 Keyword Rank Monitoring with automated daily tracking
- 🤖 Gemini AI integration for intelligent SEO insights
- 🔗 Backlink Intelligence and monitoring
- 🕷️ Site Crawler for deep technical SEO audits
- 📱 Responsive dashboard with dark mode support

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Zustand, TanStack Query |
| **Backend** | Node.js 22, Express 5, TypeScript, Zod |
| **Database** | MongoDB Atlas, Mongoose 8 |
| **Auth** | JWT (access + refresh token rotation), bcrypt, HttpOnly cookies |
| **AI** | Google Gemini 2.5 Flash/Pro |

## Project Structure

```
seo-rank-tracker/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── stores/            # Zustand state stores
│   │   ├── lib/               # Utilities, API client
│   │   └── App.tsx            # Root component with routing
│   └── vite.config.ts
├── server/                    # Express Backend
│   ├── src/
│   │   ├── config/            # DB, Redis, env, constants
│   │   ├── middleware/        # Auth, validation, error handler
│   │   ├── models/            # Mongoose schemas
│   │   ├── modules/           # Feature modules (auth, etc.)
│   │   ├── utils/             # Logger, helpers, response formatter
│   │   └── server.ts          # Entry point
│   └── tsconfig.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 22+
- MongoDB (local or Atlas)
- Redis (optional, for queues)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/seo-rank-tracker.git
cd seo-rank-tracker

# Install backend dependencies
cd server
cp .env.example .env    # Edit with your values
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Development

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API calls to `http://localhost:5000`.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new account |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout (invalidate refresh token) |
| POST | `/api/v1/auth/logout-all` | Logout from all devices |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password/:token` | Reset password |
| PUT | `/api/v1/auth/change-password` | Change password (authenticated) |
| GET | `/api/v1/auth/me` | Get current user profile |

## License

MIT
