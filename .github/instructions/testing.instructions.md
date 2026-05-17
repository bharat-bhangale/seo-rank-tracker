---
applyTo: "**/*.{test,spec}.ts"
---

# Testing Instructions

- Use Vitest for unit and service tests.
- Test service behavior and edge cases before controller wiring.
- Mock Browserbase, Stagehand, SerpApi, Redis, and Google APIs in unit tests.
- Use small deterministic fixtures for SERP normalization tests.
- Do not require live external API credentials in automated tests.
