---
description: Generate or extend the Phase 4 rank tracking backend module
---

Implement the rank tracking module for `{{scope}}`.

Use these project patterns:

- Models in `server/src/models/`
- Modules in `server/src/modules/rank-tracking/`
- Services throw `AppError`
- Controllers use `asyncHandler`
- Routes use `authenticate` and `validate`
- Queue work goes through `server/src/jobs/`

Requirements:

1. Store keyword configuration with domain, locale, device, tags, group, and schedule.
2. Queue rank checks with BullMQ job schedulers.
3. Run Browserbase + Stagehand as the primary SERP source.
4. Fall back to SerpApi after repeated extraction failure.
5. Store historical rank checks and rank alerts.
6. Expose endpoints for keyword CRUD, manual checks, trends, alerts, SERP features, geo-grid, and AI visibility.
