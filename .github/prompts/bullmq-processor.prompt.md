---
description: Generate a reliable BullMQ processor
---

Create a BullMQ processor named `{{processorName}}`.

The processor must:

1. Accept a typed payload.
2. Fetch fresh database records by ID.
3. Update job progress at meaningful steps.
4. Use exponential retry options from the queue definition.
5. Log completed and failed jobs with safe metadata.
6. Avoid logging credentials or provider tokens.
7. Be idempotent so retries do not corrupt data.
