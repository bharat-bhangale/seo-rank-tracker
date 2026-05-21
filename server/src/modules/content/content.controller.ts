import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../../utils/response";
import * as contentService from "./content.service";

/**
 * POST /api/v1/content/brief
 * Generate an AI-powered content brief for a keyword.
 */
export const generateBrief = asyncHandler(async (req: Request, res: Response) => {
  const report = await contentService.generateContentBrief(req.user!.id, req.body);
  sendSuccess(res, { report }, 201, "Content brief generated successfully");
});

/**
 * POST /api/v1/content/score
 * Score existing content against a target keyword.
 */
export const scoreContent = asyncHandler(async (req: Request, res: Response) => {
  const report = await contentService.scoreContent(req.user!.id, req.body);
  sendSuccess(res, { report }, 200, "Content scored successfully");
});

/**
 * GET /api/v1/content/clusters/:websiteId
 * Get topic clusters for a website.
 */
export const getTopicClusters = asyncHandler(async (req: Request, res: Response) => {
  const { clusters, total, page, limit } = await contentService.getTopicClusters(
    req.user!.id,
    {
      websiteId: req.params.websiteId as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    }
  );
  sendPaginated(res, clusters, total, page, limit);
});

/**
 * POST /api/v1/content/clusters/:websiteId
 * Generate a new topic cluster from a seed keyword.
 */
export const generateCluster = asyncHandler(async (req: Request, res: Response) => {
  const cluster = await contentService.generateTopicCluster(
    req.user!.id,
    req.params.websiteId as string,
    req.body.keyword
  );
  sendSuccess(res, { cluster }, 201, "Topic cluster generated successfully");
});
