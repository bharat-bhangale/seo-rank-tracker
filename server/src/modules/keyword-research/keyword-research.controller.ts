import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./keyword-research.service";
import type {
  GenerateClusterInput,
  KeywordGapQuery,
  KeywordIdeaQuery,
  VisibilityScoreQuery,
} from "./keyword-research.validation";

export const getKeywordIdeas = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as KeywordIdeaQuery;
  const result = await service.getKeywordIdeas(query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getKeywordGap = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as KeywordGapQuery;
  const result = await service.getKeywordGap(req.user!.id, query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const generateClusters = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as GenerateClusterInput;
  const result = await service.generateTopicClusters(req.user!.id, input);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getClusters = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getClusters(req.user!.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getVisibilityScore = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as VisibilityScoreQuery;
  const result = await service.getVisibilityScore(req.user!.id, query);

  res.status(200).json({
    success: true,
    data: result,
  });
});
