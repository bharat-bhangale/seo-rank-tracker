import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as gscService from "./gsc.service";
import type { PerformanceQuery } from "./gsc.validation";

export const getAuthUrl = asyncHandler(async (req: Request, res: Response) => {
  const result = gscService.getGscAuthUrl(req.user!.id, req.body);
  sendSuccess(res, result);
});

export const connectProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await gscService.connectGscProperty(req.user!.id, req.body);
  sendSuccess(res, { property }, 201, "Search Console property connected");
});

export const listProperties = asyncHandler(async (req: Request, res: Response) => {
  const result = await gscService.listGscProperties(req.user!.id);
  sendSuccess(res, result);
});

export const syncProperty = asyncHandler(async (req: Request, res: Response) => {
  const result = await gscService.enqueueGscPropertySync(
    req.params.id as string,
    req.user!.id,
    req.body
  );
  sendSuccess(res, result, 202, "Search Console sync queued");
});

export const getPerformance = asyncHandler(async (req: Request, res: Response) => {
  const result = await gscService.getGscPerformance(
    req.params.id as string,
    req.user!.id,
    req.query as unknown as PerformanceQuery
  );
  sendSuccess(res, result);
});
