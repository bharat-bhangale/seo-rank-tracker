# SEO Rank Tracker — Copilot Instructions

## Project Overview
This is a full-stack AI SEO Rank Tracker SaaS built with TypeScript on both server (Express 5 + Mongoose 8) and client (React 19 + Vite 6 + Tailwind v4).

## Architecture
- **Backend:** Modular `route → controller → service → validation` per feature in `server/src/modules/`
- **Frontend:** React with Zustand stores, TanStack Query, and Shadcn/UI components
- **Database:** MongoDB with Mongoose schemas in `server/src/models/`
- **Validation:** Zod schemas for all request validation and AI output parsing

## Code Conventions

### TypeScript
- Strict mode enabled (`"strict": true`)
- Use explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `as const` for literal unions

### Naming
- **Files:** kebab-case (`seo-analyzer.service.ts`)
- **Models:** PascalCase (`User.model.ts`, `SeoAudit.model.ts`)
- **Functions/Variables:** camelCase (`calculateSeoScore`)
- **Interfaces:** PascalCase with `I` prefix for Mongoose docs (`IUser`, `ISeoAudit`)
- **Types:** PascalCase (`SubscriptionPlan`, `AuditResult`)
- **Constants:** UPPER_SNAKE_CASE for config (`SUBSCRIPTION_LIMITS`)

### Backend Patterns
- **Services:** Pure business logic. Throw `AppError` for errors. Never access `req`/`res`.
- **Controllers:** Thin HTTP layer. Use `asyncHandler()` wrapper. Call services, send responses.
- **Validation:** Zod schemas co-located with module. Export both schema and inferred type.
- **Responses:** Always use `sendSuccess()` or `sendPaginated()` from `utils/response.ts`.
- **Errors:** Use `AppError(message, statusCode)` — never raw `throw new Error()`.

### Frontend Patterns
- **Imports:** Use `@/` path alias for all src imports
- **State:** Zustand for global state; TanStack Query for server state
- **Styling:** Tailwind CSS v4 with custom design tokens defined in `index.css`
- **Components:** Reusable UI in `components/ui/`, feature-specific in `components/`

### Security
- Never store secrets in code; use environment variables
- JWT access tokens in memory only; refresh tokens in HttpOnly cookies
- Validate all inputs with Zod before processing
- Use `express-mongo-sanitize` to prevent NoSQL injection

## Module Structure
```
server/src/modules/<module-name>/
├── <module>.validation.ts   # Zod schemas + inferred types
├── <module>.service.ts      # Business logic
├── <module>.controller.ts   # HTTP handlers
└── <module>.routes.ts       # Express router
```
