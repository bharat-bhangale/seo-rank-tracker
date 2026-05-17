# Add Browserbase SERP Scraper Skill

## Trigger

`/add-browserbase-serp-scraper`

## Output Files

Create or update:

- `server/src/services/serp/serp.types.ts`
- `server/src/services/serp/stagehand-serp.service.ts`
- `server/src/services/serp/serpapi.service.ts`
- `server/src/services/serp/serp-normalizer.ts`
- `server/src/services/serp/rank-matcher.ts`

## Requirements

- Use Browserbase and Stagehand as the primary source.
- Use SerpApi as fallback after repeated extraction failure.
- Validate extraction output with Zod.
- Normalize organic results, local pack results, AI Overview citations, and SERP feature ownership.
- Return one provider-independent result object.
- Never throw away provider error metadata; keep enough information for debugging without storing secrets.
