import type { SeoCheckResult, CategoryScore, CheckCategory } from "./seo-analyzer.types";

/** Category weights for overall score calculation */
const CATEGORY_WEIGHTS: Record<CheckCategory, number> = {
  onPage: 0.3,
  technical: 0.25,
  performance: 0.25,
  content: 0.2,
};

/**
 * Calculate category-level scores from individual check results.
 * Critical issues apply an additional penalty to the category score.
 */
export function calculateCategoryScores(checks: SeoCheckResult[]): CategoryScore[] {
  const grouped = new Map<CheckCategory, SeoCheckResult[]>();

  for (const check of checks) {
    const existing = grouped.get(check.category) || [];
    existing.push(check);
    grouped.set(check.category, existing);
  }

  const categoryScores: CategoryScore[] = [];

  for (const [category, categoryChecks] of grouped) {
    const avgScore =
      categoryChecks.reduce((sum, c) => sum + c.score, 0) / categoryChecks.length;

    // Critical issues with score < 50 apply a 10-point penalty per issue
    const criticalCount = categoryChecks.filter(
      (c) => c.severity === "critical" && c.score < 50
    ).length;
    const criticalPenalty = criticalCount * 10;

    const warningCount = categoryChecks.filter((c) => c.severity === "warning").length;

    const score = Math.max(0, Math.round(avgScore - criticalPenalty));

    categoryScores.push({
      category,
      score,
      maxScore: 100,
      checksCount: categoryChecks.length,
      criticalCount,
      warningCount,
    });
  }

  return categoryScores;
}

/**
 * Calculate the overall weighted SEO score (0-100).
 * Uses the defined category weights.
 */
export function calculateOverallScore(categoryScores: CategoryScore[]): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const cs of categoryScores) {
    const weight = CATEGORY_WEIGHTS[cs.category] || 0;
    weightedSum += cs.score * weight;
    totalWeight += weight;
  }

  // Normalize if not all categories are present
  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

/**
 * Convert a numeric score (0-100) to a letter grade.
 */
export function scoreToGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}
