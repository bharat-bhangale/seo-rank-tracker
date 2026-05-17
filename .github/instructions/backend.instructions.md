---
applyTo: "server/**"
---

# Backend Instructions

## Express Modules

- Keep each feature in `server/src/modules/<module-name>/`.
- Use the route -> controller -> service -> validation pattern.
- Keep controllers thin and wrap async handlers with `asyncHandler`.
- Keep services responsible for business logic, persistence, queue orchestration, and external integrations.
- Throw `AppError` for operational errors.

## Data Access

- Use Mongoose models from `server/src/models/`.
- Add compound indexes for every high-volume query path.
- Use `.lean()` for read-only queries.
- Keep user ownership checks in services, not controllers.

## Background Jobs

- Long-running tasks must go through BullMQ queues.
- Use idempotent job names and stable scheduler IDs.
- Configure retries with exponential backoff.
- Keep queue payloads small and fetch current data inside processors.
- Update job progress for multi-step work.

## External Integrations

- Read credentials from `server/src/config/env.ts`.
- Never log API keys, OAuth tokens, refresh tokens, or raw provider responses that may contain secrets.
- Normalize external responses before storing them.
- Put provider-specific logic behind service functions so controllers and workers use the same output shape.
