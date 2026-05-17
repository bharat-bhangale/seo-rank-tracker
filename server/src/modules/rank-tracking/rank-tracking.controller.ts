import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendPaginated, sendSuccess } from "../../utils/response";
import * as rankTrackingService from "./rank-tracking.service";
import type { AlertQuery, KeywordListQuery } from "./rank-tracking.validation";

export const createKeyword = asyncHandler(async (req: Request, res: Response) => {
  const keyword = await rankTrackingService.createKeyword(req.user!.id, req.body);
  sendSuccess(res, { keyword }, 201, "Keyword created successfully");
});

export const getKeywords = asyncHandler(async (req: Request, res: Response) => {
  const result = await rankTrackingService.getKeywords(
    req.user!.id,
    req.query as unknown as KeywordListQuery
  );
  sendPaginated(res, result.keywords, result.total, result.page, result.limit);
});

export const getKeyword = asyncHandler(async (req: Request, res: Response) => {
  const keyword = await rankTrackingService.getKeywordById(
    req.params.id as string,
    req.user!.id
  );
  sendSuccess(res, { keyword });
});

export const updateKeyword = asyncHandler(async (req: Request, res: Response) => {
  const keyword = await rankTrackingService.updateKeyword(
    req.params.id as string,
    req.user!.id,
    req.body
  );
  sendSuccess(res, { keyword }, 200, "Keyword updated successfully");
});

export const deleteKeyword = asyncHandler(async (req: Request, res: Response) => {
  await rankTrackingService.deleteKeyword(req.params.id as string, req.user!.id);
  sendSuccess(res, null, 200, "Keyword deleted successfully");
});

export const manualCheck = asyncHandler(async (req: Request, res: Response) => {
  const result = await rankTrackingService.enqueueManualRankCheck(
    req.params.id as string,
    req.user!.id,
    req.body.location
  );
  sendSuccess(res, result, 202, "Rank check queued");
});

export const bulkImport = asyncHandler(async (req: Request, res: Response) => {
  const result = await rankTrackingService.importKeywordsFromCsv(req.user!.id, req.body);
  sendSuccess(res, result, 201, "Bulk import completed");
});

export const getTrend = asyncHandler(async (req: Request, res: Response) => {
  const result = await rankTrackingService.getKeywordTrend(
    req.params.id as string,
    req.user!.id,
    Number(req.query.days || 30)
  );
  sendSuccess(res, result);
});

export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const result = await rankTrackingService.getRankAlerts(
    req.user!.id,
    req.query as unknown as AlertQuery
  );
  sendPaginated(res, result.alerts, result.total, result.page, result.limit);
});

export const markAlertRead = asyncHandler(async (req: Request, res: Response) => {
  const alert = await rankTrackingService.markAlertRead(
    req.params.alertId as string,
    req.user!.id
  );
  sendSuccess(res, { alert }, 200, "Alert marked as read");
});

export const getFeatureSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await rankTrackingService.getSerpFeatureSummary(
    req.user!.id,
    Number(req.query.days || 30)
  );
  sendSuccess(res, result);
});

export const enqueueGeoGrid = asyncHandler(async (req: Request, res: Response) => {
  const result = await rankTrackingService.enqueueGeoGridChecks(
    req.params.id as string,
    req.user!.id,
    req.body
  );
  sendSuccess(res, result, 202, "Geo-grid rank checks queued");
});

export const getGeoGrid = asyncHandler(async (req: Request, res: Response) => {
  const result = await rankTrackingService.getLatestGeoGrid(
    req.params.id as string,
    req.user!.id
  );
  sendSuccess(res, result);
});

export const getAiVisibility = asyncHandler(async (req: Request, res: Response) => {
  const result = await rankTrackingService.getAiVisibility(req.user!.id, {
    keywordId: req.query.keywordId as string | undefined,
    domain: req.query.domain as string | undefined,
  });
  sendSuccess(res, result);
});
