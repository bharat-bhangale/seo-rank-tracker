import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as userService from "./user.service";

/**
 * GET /api/v1/users/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getProfile(req.user!.id);
  sendSuccess(res, { user });
});

/**
 * PUT /api/v1/users/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.id, req.body);
  sendSuccess(res, { user }, 200, "Profile updated successfully");
});

/**
 * GET /api/v1/users/usage
 */
export const getUsage = asyncHandler(async (req: Request, res: Response) => {
  const usage = await userService.getUsageStats(req.user!.id);
  sendSuccess(res, usage);
});

/**
 * DELETE /api/v1/users/account
 */
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteAccount(req.user!.id);
  res.clearCookie("refreshToken");
  sendSuccess(res, null, 200, "Account deleted successfully");
});
