/**
 * Zod schemas for validating Gemini AI structured responses.
 * These ensure the AI output matches our expected format.
 */

import { z } from "zod";

// ── SEO Report Response Schema ─────────────────────────

export const seoReportResponseSchema = z.object({
  executiveSummary: z.string(),
  overallAssessment: z.enum(["excellent", "good", "needs_improvement", "poor", "critical"]),
  prioritizedActions: z.array(
    z.object({
      priority: z.number().int().min(1).max(10),
      category: z.string(),
      title: z.string(),
      description: z.string(),
      impact: z.enum(["high", "medium", "low"]),
      effort: z.enum(["quick_fix", "moderate", "major_project"]),
      codeSnippet: z.string().optional(),
    })
  ),
  strengths: z.array(z.string()),
  technicalRoadmap: z.array(
    z.object({
      phase: z.enum(["immediate", "short_term", "long_term"]),
      action: z.string(),
      expectedImpact: z.string(),
    })
  ),
  contentRecommendations: z.array(z.string()),
  estimatedScoreAfterFixes: z.number().min(0).max(100),
});

export type SeoReportResponse = z.infer<typeof seoReportResponseSchema>;

// ── Content Brief Response Schema ──────────────────────

export const contentBriefResponseSchema = z.object({
  targetKeyword: z.string(),
  contentType: z.string(),
  recommendedWordCount: z.object({
    minimum: z.number(),
    optimal: z.number(),
    maximum: z.number(),
  }),
  searchIntent: z.string(),
  titleSuggestions: z.array(z.string()),
  metaDescription: z.string(),
  headingStructure: z.array(
    z.object({
      tag: z.string(),
      text: z.string(),
      notes: z.string().optional(),
    })
  ),
  semanticKeywords: z.array(
    z.object({
      keyword: z.string(),
      importance: z.enum(["high", "medium", "low"]),
      suggestedUsage: z.string().optional(),
    })
  ),
  questionsToAnswer: z.array(z.string()),
  faqSuggestions: z.array(
    z.object({
      question: z.string(),
      answerGuideline: z.string(),
    })
  ),
  internalLinkingSuggestions: z.array(z.string()),
  toneAndStyle: z.string(),
  uniqueAngle: z.string(),
});

export type ContentBriefResponse = z.infer<typeof contentBriefResponseSchema>;

// ── Content Optimization Response Schema ───────────────

export const contentOptimizationResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    keywordOptimization: z.object({ score: z.number(), details: z.string() }),
    contentDepth: z.object({ score: z.number(), details: z.string() }),
    readability: z.object({ score: z.number(), details: z.string() }),
    headingStructure: z.object({ score: z.number(), details: z.string() }),
    eatSignals: z.object({ score: z.number(), details: z.string() }),
  }),
  missingTopics: z.array(
    z.object({
      topic: z.string(),
      importance: z.enum(["high", "medium", "low"]),
      suggestion: z.string(),
    })
  ),
  keywordSuggestions: z.array(
    z.object({
      keyword: z.string(),
      currentCount: z.number(),
      recommendedCount: z.number(),
      placement: z.string(),
    })
  ),
  headingImprovements: z.array(
    z.object({
      current: z.string().nullable(),
      suggested: z.string(),
      reason: z.string(),
    })
  ),
  readabilityFixes: z.array(z.string()),
  contentGaps: z.array(z.string()),
  estimatedScoreAfterOptimization: z.number().min(0).max(100),
});

export type ContentOptimizationResponse = z.infer<typeof contentOptimizationResponseSchema>;

// ── Competitor Analysis Response Schema ────────────────

export const competitorAnalysisResponseSchema = z.object({
  summary: z.string(),
  yourPosition: z.enum(["strong", "competitive", "average", "weak"]),
  competitorProfiles: z.array(
    z.object({
      url: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      threatLevel: z.enum(["high", "medium", "low"]),
      keyDifferentiator: z.string(),
    })
  ),
  contentGaps: z.array(
    z.object({
      topic: z.string(),
      coveredBy: z.array(z.string()),
      priority: z.enum(["high", "medium", "low"]),
      recommendation: z.string(),
    })
  ),
  strategicRecommendations: z.array(
    z.object({
      category: z.string(),
      action: z.string(),
      rationale: z.string(),
      priority: z.number(),
      estimatedImpact: z.enum(["high", "medium", "low"]),
    })
  ),
  quickWins: z.array(z.string()),
  longTermStrategy: z.string(),
});

export type CompetitorAnalysisResponse = z.infer<typeof competitorAnalysisResponseSchema>;
