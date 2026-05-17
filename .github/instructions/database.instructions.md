---
applyTo: "server/src/models/**"
---

# Database Instructions

## Mongoose Models

- Export both the document interface and model.
- Use PascalCase model names and `*.model.ts` filenames.
- Use `timestamps: true` for auditable collections.
- Add indexes for ownership, foreign keys, status, scheduling, and time-series reads.
- Store high-volume historical rank data in append-only records.

## Rank Tracking Collections

- `Keyword` stores user configuration and scheduling state.
- `RankCheck` stores one observed SERP snapshot per keyword check.
- `RankAlert` stores meaningful rank or SERP feature changes.
- `GscProperty` stores OAuth connection metadata and encrypted token placeholders.
- `GscPerformance` stores imported Search Console daily metrics.
