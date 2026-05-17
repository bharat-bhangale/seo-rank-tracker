import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./backlinks.service";
import type { BacklinkQuery, CompetitorGapQuery, SyncBacklinksInput, UpdateBacklinkInput } from "./backlinks.validation";

export const getBacklinks = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as BacklinkQuery;
  const result = await service.getBacklinks(req.user!.id, query);

  res.status(200).json({
    success: true,
    data: result.backlinks,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
});

export const updateBacklink = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const input = req.body as UpdateBacklinkInput;
  const result = await service.updateBacklink(req.user!.id, id, input);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const domain = req.query.domain as string;
  const result = await service.getBacklinkStats(req.user!.id, domain);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const syncBacklinks = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as SyncBacklinksInput;
  const result = await service.enqueueSync(req.user!.id, input);

  res.status(202).json({
    success: true,
    data: result,
  });
});

export const getCompetitorGap = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as CompetitorGapQuery;
  const result = await service.getCompetitorGap(req.user!.id, query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const downloadDisavow = asyncHandler(async (req: Request, res: Response) => {
  const domain = req.query.domain as string;
  const disavowText = await service.generateDisavowFile(req.user!.id, domain);

  res.setHeader("Content-Disposition", `attachment; filename="disavow_${domain}.txt"`);
  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(disavowText);
});
