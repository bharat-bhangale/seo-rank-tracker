# Add SEO Check Skill

## Trigger
`/add-seo-check <check-name>`

## What It Does
Creates a new SEO check function that follows the standard check interface for the analysis pipeline.

## Output
Adds to `server/src/modules/seo-analyzer/checks/<check-name>.check.ts`

## Standard Check Interface
```typescript
export interface SeoCheckResult {
  name: string;
  category: "onPage" | "technical" | "performance" | "content";
  score: number;        // 0-100
  maxScore: number;     // Usually 100
  severity: "critical" | "warning" | "info" | "pass";
  message: string;      // Human-readable summary
  details?: unknown;    // Check-specific extra data
}
```

## Template
```typescript
import * as cheerio from "cheerio";
import type { SeoCheckResult } from "../seo-analyzer.types";

/**
 * Check: <Check Name>
 * Category: onPage | technical | performance | content
 *
 * What it checks: <description>
 * Why it matters: <SEO impact>
 */
export function check<CheckName>(
  $: cheerio.CheerioAPI,
  url: string
): SeoCheckResult {
  // Implementation
  return {
    name: "<check-name>",
    category: "onPage",
    score: 100,
    maxScore: 100,
    severity: "pass",
    message: "Check passed",
  };
}
```

## Rules
- Each check is a pure function (no side effects, no DB calls)
- Accepts a Cheerio instance and URL string
- Returns a standardized `SeoCheckResult` object
- Score of 0 = complete failure, 100 = perfect
- severity: critical (0-30), warning (31-60), info (61-80), pass (81-100)
