import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../../utils/response";
import * as competitorsService from "./competitors.service";

/**
 * POST /api/v1/competitors/analyze
 * Run AI-powered competitor analysis.
 */
export const analyzeCompetitors = asyncHandler(async (req: Request, res: Response) => {
  const report = await competitorsService.analyzeCompetitors(req.user!.id, req.body);
  sendSuccess(res, { report }, 201, "Competitor analysis generated successfully");
});

/**
 * GET /api/v1/competitors/:websiteId
 * Get competitor analysis history for a website.
 */
export const getCompetitorReports = asyncHandler(async (req: Request, res: Response) => {
  const { reports, total, page, limit } = await competitorsService.getCompetitorReports(
    req.user!.id,
    req.params.websiteId as string,
    req.query as any
  );
  sendPaginated(res, reports, total, page, limit);
});
