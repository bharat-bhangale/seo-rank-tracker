import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./analytics.service";

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const domain = req.query.domain as string | undefined;
  const data = await service.getDashboardKPIs(req.user!.id, domain);

  res.status(200).json({
    success: true,
    data,
  });
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getNotifications(req.user!.id);
  
  res.status(200).json({
    success: true,
    data,
  });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = await service.markNotificationRead(req.user!.id, id);

  res.status(200).json({
    success: true,
    data,
  });
});
