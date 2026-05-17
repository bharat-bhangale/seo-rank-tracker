import axios from "axios";
import * as cheerio from "cheerio";
import { AiReport } from "../../models/AiReport.model";
import { SeoAudit } from "../../models/SeoAudit.model";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import { geminiService } from "../../services/gemini.service";
import { renderPrompt } from "../../services/prompt-template.service";
import {
  seoReportResponseSchema,
  contentBriefResponseSchema,
  contentOptimizationResponseSchema,
  competitorAnalysisResponseSchema,
} from "./ai-response.schemas";
import type {
  GenerateSeoReportInput,
  GenerateContentBriefInput,
  ScoreContentInput,
  AnalyzeCompetitorsInput,
} from "./ai-reports.validation";

// ── Helper: Fetch page metadata for competitor/content analysis ─

async function fetchPageMetadata(url: string) {
  try {
    const response = await axios.get(url, {
      timeout: 15_000,
      maxContentLength: 2 * 1024 * 1024,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEORankTracker/1.0)",
        Accept: "text/html",
      },
    });

    const html = typeof response.data === "string" ? response.data : String(response.data);
    const $ = cheerio.load(html);

    // Extract headings
    const headings: Array<{ tag: string; text: string }> = [];
    $("h1, h2, h3").each((_, el) => {
      const tag = $(el).prop("tagName")?.toLowerCase() || "h2";
      const text = $(el).text().trim();
      if (text && headings.length < 20) {
        headings.push({ tag, text });
      }
    });

    // Get body word count
    const bodyClone = $("body").clone();
    bodyClone.find("script, style, nav, header, footer, noscript").remove();
    const bodyText = bodyClone.text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 0).length;

    return {
      url,
      title: $("title").first().text().trim() || "",
      description: $('meta[name="description"]').attr("content")?.trim() || "",
      headings,
      wordCount,
    };
  } catch (error: any) {
    logger.warn(`Failed to fetch ${url}: ${error.message}`);
    return {
      url,
      title: "Could not fetch",
      description: "",
      headings: [],
      wordCount: 0,
    };
  }
}

// ── Feature 3.2: AI SEO Report Generator ───────────────

/**
 * Generate an AI-powered SEO report from an existing audit.
 */
export async function generateSeoReport(userId: string, input: GenerateSeoReportInput) {
  // Fetch the audit
  const audit = await SeoAudit.findById(input.auditId);
  if (!audit) {
    throw new AppError("Audit not found.", 404);
  }
  if (audit.userId.toString() !== userId) {
    throw new AppError("You do not have access to this audit.", 403);
  }
  if (audit.status !== "completed") {
    throw new AppError("Cannot generate report for an incomplete audit.", 400);
  }

  // Create report record
  const report = await AiReport.create({
    userId,
    auditId: audit._id,
    reportType: "seo_report",
    url: audit.url,
    status: "generating",
  });

  try {
    // Render prompt from template
    const prompt = renderPrompt("seo-report", {
      url: audit.url,
      auditDate: audit.createdAt.toISOString().split("T")[0],
      overallScore: audit.overallScore,
      grade: audit.grade,
      categoryScores: audit.categoryScores,
      checks: audit.checks,
      pageData: audit.pageData,
    });

    // Call Gemini with structured output
    const { data, usage } = await geminiService.generateStructured(
      prompt,
      seoReportResponseSchema,
      { useProModel: true, userId, cache: true }
    );

    // Update report with AI response
    report.executiveSummary = data.executiveSummary;
    report.overallAssessment = data.overallAssessment;
    report.prioritizedActions = data.prioritizedActions;
    report.strengths = data.strengths;
    report.technicalRoadmap = data.technicalRoadmap;
    report.contentRecommendations = data.contentRecommendations;
    report.estimatedScoreAfterFixes = data.estimatedScoreAfterFixes;
    report.rawResponse = data as unknown as Record<string, unknown>;
    report.tokenUsage = usage;
    report.status = "completed";
    await report.save();

    logger.info(`SEO report generated for ${audit.url} — ${usage.totalTokens} tokens`);
    return report;
  } catch (error: any) {
    report.status = "failed";
    report.errorMessage = error.message;
    await report.save();
    throw error;
  }
}

// ── Feature 3.4: AI Content Brief Generator ────────────

/**
 * Generate an AI content brief for a target keyword.
 * Optionally analyzes competitor pages for context.
 */
export async function generateContentBrief(userId: string, input: GenerateContentBriefInput) {
  const report = await AiReport.create({
    userId,
    reportType: "content_brief",
    keyword: input.keyword,
    status: "generating",
  });

  try {
    // Fetch competitor data if URLs provided
    let competitorInsights: Awaited<ReturnType<typeof fetchPageMetadata>>[] = [];
    if (input.competitorUrls && input.competitorUrls.length > 0) {
      competitorInsights = await Promise.all(
        input.competitorUrls.map((url) => fetchPageMetadata(url))
      );
    }

    const prompt = renderPrompt("content-brief", {
      keyword: input.keyword,
      secondaryKeywords: input.secondaryKeywords || [],
      competitorInsights,
    });

    const { data, usage } = await geminiService.generateStructured(
      prompt,
      contentBriefResponseSchema,
      { useProModel: true, userId }
    );

    report.rawResponse = data as unknown as Record<string, unknown>;
    report.executiveSummary = `Content brief for "${input.keyword}" — ${data.contentType}, ${data.recommendedWordCount.optimal} words recommended`;
    report.tokenUsage = usage;
    report.status = "completed";
    await report.save();

    logger.info(`Content brief generated for "${input.keyword}" — ${usage.totalTokens} tokens`);
    return report;
  } catch (error: any) {
    report.status = "failed";
    report.errorMessage = error.message;
    await report.save();
    throw error;
  }
}

// ── Feature 3.5: AI Content Optimization Scorer ────────

/**
 * Score existing content against SEO best practices for a keyword.
 */
export async function scoreContent(userId: string, input: ScoreContentInput) {
  const report = await AiReport.create({
    userId,
    reportType: "content_optimization",
    keyword: input.keyword,
    status: "generating",
  });

  try {
    const wordCount = input.content.split(/\s+/).filter((w) => w.length > 0).length;

    const prompt = renderPrompt("content-optimizer", {
      keyword: input.keyword,
      secondaryKeywords: input.secondaryKeywords || [],
      title: input.title,
      content: input.content,
      wordCount,
    });

    const { data, usage } = await geminiService.generateStructured(
      prompt,
      contentOptimizationResponseSchema,
      { useProModel: false, userId } // Flash is fast enough for scoring
    );

    report.rawResponse = data as unknown as Record<string, unknown>;
    report.executiveSummary = `Content score: ${data.overallScore}/100 for "${input.keyword}" — Est. ${data.estimatedScoreAfterOptimization}/100 after fixes`;
    report.tokenUsage = usage;
    report.status = "completed";
    await report.save();

    logger.info(`Content optimization scored for "${input.keyword}" — Score: ${data.overallScore}`);
    return report;
  } catch (error: any) {
    report.status = "failed";
    report.errorMessage = error.message;
    await report.save();
    throw error;
  }
}

// ── Feature 3.6: AI Competitor Analysis ────────────────

/**
 * Analyze competitor websites and generate strategic insights.
 */
export async function analyzeCompetitors(userId: string, input: AnalyzeCompetitorsInput) {
  const report = await AiReport.create({
    userId,
    reportType: "competitor_analysis",
    url: input.yourUrl,
    status: "generating",
  });

  try {
    // Fetch metadata for all sites in parallel
    const [yourSite, ...competitorSites] = await Promise.all([
      fetchPageMetadata(input.yourUrl),
      ...input.competitorUrls.map((url) => fetchPageMetadata(url)),
    ]);

    const prompt = renderPrompt("competitor-analysis", {
      yourSite,
      competitors: competitorSites,
    });

    const { data, usage } = await geminiService.generateStructured(
      prompt,
      competitorAnalysisResponseSchema,
      { useProModel: true, userId }
    );

    report.rawResponse = data as unknown as Record<string, unknown>;
    report.executiveSummary = data.summary;
    report.tokenUsage = usage;
    report.status = "completed";
    await report.save();

    logger.info(`Competitor analysis completed for ${input.yourUrl} vs ${input.competitorUrls.length} competitors`);
    return report;
  } catch (error: any) {
    report.status = "failed";
    report.errorMessage = error.message;
    await report.save();
    throw error;
  }
}

// ── Report History ─────────────────────────────────────

/**
 * Get a specific report by ID. Verifies user ownership.
 */
export async function getReportById(reportId: string, userId: string) {
  const report = await AiReport.findById(reportId);
  if (!report) {
    throw new AppError("Report not found.", 404);
  }
  if (report.userId.toString() !== userId) {
    throw new AppError("You do not have access to this report.", 403);
  }
  return report;
}

/**
 * Get report history for the current user with pagination and type filter.
 */
export async function getReportHistory(
  userId: string,
  options: { reportType?: string; page: number; limit: number }
) {
  const filter: Record<string, unknown> = { userId };
  if (options.reportType) {
    filter.reportType = options.reportType;
  }

  const [reports, total] = await Promise.all([
    AiReport.find(filter)
      .select("-rawResponse") // Exclude heavy field in list view
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    AiReport.countDocuments(filter),
  ]);

  return { reports, total, page: options.page, limit: options.limit };
}

/**
 * Get AI usage statistics for a user (total tokens, cost).
 */
export async function getUsageStats(userId: string) {
  const stats = await AiReport.aggregate([
    { $match: { userId: new (await import("mongoose")).Types.ObjectId(userId), status: "completed" } },
    {
      $group: {
        _id: "$reportType",
        count: { $sum: 1 },
        totalTokens: { $sum: "$tokenUsage.totalTokens" },
        totalCost: { $sum: "$tokenUsage.estimatedCostUsd" },
      },
    },
  ]);

  const totals = stats.reduce(
    (acc, s) => ({
      totalReports: acc.totalReports + s.count,
      totalTokens: acc.totalTokens + s.totalTokens,
      totalCost: parseFloat((acc.totalCost + s.totalCost).toFixed(4)),
    }),
    { totalReports: 0, totalTokens: 0, totalCost: 0 }
  );

  return { byType: stats, totals };
}
