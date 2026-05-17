# Add GSC Integration Skill

## Trigger

`/add-gsc-integration`

## Output Files

Create or update:

- `server/src/models/GscProperty.model.ts`
- `server/src/models/GscPerformance.model.ts`
- `server/src/modules/gsc/gsc.validation.ts`
- `server/src/modules/gsc/gsc.service.ts`
- `server/src/modules/gsc/gsc.controller.ts`
- `server/src/modules/gsc/gsc.routes.ts`
- `server/src/jobs/processors/gsc-sync.processor.ts`

## Requirements

- Use Google OAuth2 with Search Console readonly scope.
- Store connection metadata separately from imported performance rows.
- Do not query the last 48 hours by default because data may be incomplete.
- Import dimensions in the order `date`, `query`, `page`, `country`, `device`.
- Use BullMQ for sync jobs.
