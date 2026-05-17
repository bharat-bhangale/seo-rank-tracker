import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../../utils/response";
import * as aiReportsService from "./ai-reports.service";

/**
 * POST /api/v1/ai/reports/seo
 * Generate an AI SEO report from an existing audit.
 */
export const generateSeoReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await aiReportsService.generateSeoReport(req.user!.id, req.body);
  sendSuccess(res, { report }, 201, "AI SEO report generated successfully");
});

/**
 * POST /api/v1/ai/reports/content-brief
 * Generate an AI content brief for a keyword.
 */
export const generateContentBrief = asyncHandler(async (req: Request, res: Response) => {
  const report = await aiReportsService.generateContentBrief(req.user!.id, req.body);
  sendSuccess(res, { report }, 201, "Content brief generated successfully");
});

/**
 * POST /api/v1/ai/reports/content-score
 * Score existing content against SEO best practices.
 */
export const scoreContent = asyncHandler(async (req: Request, res: Response) => {
  const report = await aiReportsService.scoreContent(req.user!.id, req.body);
  sendSuccess(res, { report }, 201, "Content optimization score generated");
});

/**
 * POST /api/v1/ai/reports/competitor-analysis
 * Analyze competitor websites.
 */
export const analyzeCompetitors = asyncHandler(async (req: Request, res: Response) => {
  const report = await aiReportsService.analyzeCompetitors(req.user!.id, req.body);
  sendSuccess(res, { report }, 201, "Competitor analysis completed");
});

/**
 * GET /api/v1/ai/reports/:id
 * Get a specific AI report by ID.
 */
export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await aiReportsService.getReportById(
    req.params.id as string,
    req.user!.id
  );
  sendSuccess(res, { report });
});

/**
 * GET /api/v1/ai/reports/history
 * Get paginated report history.
 */
export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const { reports, total, page, limit } = await aiReportsService.getReportHistory(
    req.user!.id,
    req.query as any
  );
  sendPaginated(res, reports, total, page, limit);
});

/**
 * GET /api/v1/ai/usage
 * Get AI usage statistics for the current user.
 */
export const getUsage = asyncHandler(async (req: Request, res: Response) => {
  const stats = await aiReportsService.getUsageStats(req.user!.id);
  sendSuccess(res, stats);
});
