/**
 * Shared types for the SEO analysis pipeline.
 * All checks return SeoCheckResult; audits aggregate into SeoAuditResult.
 */

export type CheckCategory = "onPage" | "technical" | "performance" | "content";
export type CheckSeverity = "critical" | "warning" | "info" | "pass";

/** Result of a single SEO check */
export interface SeoCheckResult {
  name: string;
  category: CheckCategory;
  score: number;
  maxScore: number;
  severity: CheckSeverity;
  message: string;
  details?: Record<string, unknown>;
}

/** Category score breakdown */
export interface CategoryScore {
  category: CheckCategory;
  score: number;
  maxScore: number;
  checksCount: number;
  criticalCount: number;
  warningCount: number;
}

/** Complete SEO audit result */
export interface SeoAuditResult {
  url: string;
  fetchedAt: Date;
  overallScore: number;
  grade: string;
  categoryScores: CategoryScore[];
  checks: SeoCheckResult[];
  pageData: PageData;
}

/** Raw page data extracted during fetch */
export interface PageData {
  url: string;
  finalUrl: string;
  statusCode: number;
  contentLength: number;
  loadTimeMs: number;
  isHttps: boolean;
  title?: string;
  description?: string;
  h1?: string;
}
