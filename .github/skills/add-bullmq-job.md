# Add BullMQ Job Skill

## Trigger

`/add-bullmq-job <queue-name> <job-name>`

## Output Files

Create or update:

- `server/src/jobs/connection.ts`
- `server/src/jobs/queues.ts`
- `server/src/jobs/processors/<name>.processor.ts`
- `server/src/jobs/worker.ts`
- `server/src/jobs/bullBoard.ts`

## Implementation Checklist

1. Add a queue name constant.
2. Add a typed job payload interface.
3. Add queue options with attempts, exponential backoff, and cleanup limits.
4. Add a processor that fetches current records by ID.
5. Add progress updates.
6. Register the worker with concurrency limits.
7. Add graceful shutdown handlers.
8. Add dashboard visibility through Bull Board.
