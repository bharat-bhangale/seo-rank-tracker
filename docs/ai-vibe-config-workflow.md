# SEO Rank Tracker — AI Vibe Config & Workflow Guide

> This document covers all AI-assisted development configurations, GitHub Copilot agents, hooks, skills, and workflow patterns used in this project.

---

## Part 1: Repository AI Configuration

### 1.1 Copilot Instructions (`.github/copilot-instructions.md`)

The repository-level instructions file tells Copilot (and Antigravity) the project conventions:

- **Language:** TypeScript (strict mode) for both server and client
- **Architecture:** Modular route → controller → service → validation per feature
- **Validation:** Zod schemas on all endpoints; never trust raw `req.body`
- **Error Handling:** Always throw `AppError` in services; never `res.status()` in services
- **Response Format:** Use `sendSuccess()` / `sendPaginated()` helpers from `utils/response.ts`
- **Naming:** PascalCase for models/classes, camelCase for functions/variables, kebab-case for files
- **Imports:** Use `@/` alias for path resolution in both server and client

### 1.2 Custom Agents

| Agent | File | Purpose |
|-------|------|---------|
| SEO Module Agent | `.github/agents/seo-module-agent.md` | Scaffolds new SEO feature modules following the established pattern |
| Code Review Agent | `.github/agents/code-review-agent.md` | Reviews PRs for security, performance, and convention compliance |

### 1.3 Custom Skills

| Skill | File | Purpose |
|-------|------|---------|
| Scaffold Module | `.github/skills/scaffold-module.md` | Creates route/controller/service/validation files for a new module |
| Add Mongoose Model | `.github/skills/add-mongoose-model.md` | Creates a properly typed Mongoose model with indexes and interfaces |
| Add SEO Check | `.github/skills/add-seo-check.md` | Adds a new SEO check function to the analyzer pipeline |

### 1.4 Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| Pre-commit | `git commit` | Runs `tsc --noEmit` and lint before allowing commit |
| PR Template | PR creation | Generates structured PR description with checklist |

---

## Part 2: Development Workflow Patterns

### 2.1 Module Development Flow

```
1. Define Zod validation schemas (types + rules)
2. Create Mongoose model (if new collection)
3. Implement service layer (pure business logic)
4. Create controller (thin HTTP adapter)
5. Define routes (middleware chain)
6. Register routes in server.ts
7. Run `tsc --noEmit` to verify
8. Write integration tests
```

### 2.2 AI-Accelerated Patterns

#### Using Copilot Agent for Module Scaffolding
```
@seo-module-agent Create a new module called "seo-analyzer" with:
- POST /api/v1/analyzer/audit (run on-page audit)
- GET /api/v1/analyzer/audit/:id (get audit result)
- GET /api/v1/analyzer/history (list audit history)
Follow the existing auth module pattern in server/src/modules/auth/
```

#### Using Skills for Repetitive Tasks
```
/scaffold-module website-analyzer
→ Creates: validation.ts, service.ts, controller.ts, routes.ts

/add-seo-check image-alt-check
→ Creates check function with standard { score, severity, message } output

/add-mongoose-model SeoAudit
→ Creates model with interface, schema, indexes, and timestamps
```

### 2.3 Prompt Templates for AI Coding

#### Service Function Pattern
```typescript
// Prompt: "Create a service function that [does X]"
// Context: Follow the pattern in auth.service.ts
// - Export async function with typed parameters
// - Throw AppError for operational errors
// - Return typed data (never Response objects)
// - Use Mongoose lean() for read-only queries
```

#### Zod Schema Pattern
```typescript
// Prompt: "Create a Zod schema for [input type]"
// Context: Follow the pattern in auth.validation.ts
// - Export the schema AND the inferred type
// - Add descriptive error messages
// - Use .trim() on strings, .toLowerCase() on emails
// - Chain validation rules (min, max, regex)
```

### 2.4 Token Optimization Strategies

1. **Path aliases:** Use `@/` imports to reduce context length
2. **Barrel exports:** Create `index.ts` files for commonly used utilities
3. **Shared types:** Define interfaces in dedicated `.types.ts` files
4. **Focused context:** Only open relevant files when prompting AI
5. **Reusable patterns:** Once established, reference existing module as template

### 2.5 Quality Gates

| Gate | Tool | Trigger |
|------|------|---------|
| Type Safety | `tsc --noEmit` | Pre-commit hook, CI pipeline |
| Linting | ESLint | Pre-commit hook, CI pipeline |
| Tests | Vitest | CI pipeline on PR |
| Security | `npm audit` | Weekly Dependabot scan |
| Build | `npm run build` | CI pipeline on merge to main |

---

## Part 3: File Reference

### Configuration Files
- `.github/copilot-instructions.md` — Repository-wide AI instructions
- `.github/agents/seo-module-agent.md` — Module scaffolding agent
- `.github/agents/code-review-agent.md` — PR review agent
- `.github/skills/scaffold-module.md` — Module scaffold skill
- `.github/skills/add-mongoose-model.md` — Model creation skill
- `.github/skills/add-seo-check.md` — SEO check creation skill

### Project Documentation
- `docs/01-project-overview-and-architecture.md` — 8-phase roadmap
- `docs/02-detailed-feature-descriptions.md` — All 48 feature specs
- `docs/03-implementation-and-devops-guide.md` — DevOps & deployment
- `docs/ai-vibe-config-workflow.md` — This file
