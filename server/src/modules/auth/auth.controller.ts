import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { COOKIE_OPTIONS } from "../../config/constants";
import * as authService from "./auth.service";

/**
 * POST /api/v1/auth/register
 * Create a new user account.
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  sendSuccess(res, { user, accessToken }, 201, "Account created successfully");
});

/**
 * POST /api/v1/auth/login
 * Authenticate user with email + password.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  sendSuccess(res, { user, accessToken }, 200, "Logged in successfully");
});

/**
 * POST /api/v1/auth/refresh
 * Issue new access + refresh token pair (token rotation).
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies?.refreshToken;

  if (!oldRefreshToken) {
    res.status(401).json({ success: false, error: "No refresh token provided" });
    return;
  }

  const { accessToken, refreshToken } =
    await authService.refreshAccessToken(oldRefreshToken);

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  sendSuccess(res, { accessToken }, 200);
});

/**
 * POST /api/v1/auth/logout
 * Invalidate the current refresh token.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.clearCookie("refreshToken", COOKIE_OPTIONS);

  sendSuccess(res, null, 200, "Logged out successfully");
});

/**
 * POST /api/v1/auth/logout-all
 * Invalidate ALL refresh tokens (logout from all devices).
 */
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutAll(req.user!.id);

  res.clearCookie("refreshToken", COOKIE_OPTIONS);

  sendSuccess(res, null, 200, "Logged out from all devices");
});

/**
 * POST /api/v1/auth/forgot-password
 * Send a password reset email.
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const resetToken = await authService.forgotPassword(req.body.email);

    // TODO: Send reset email via Resend
    // In development, return the token for testing
    const responseData =
      process.env.NODE_ENV === "development" ? { resetToken } : {};

    sendSuccess(
      res,
      responseData,
      200,
      "If an account with that email exists, a reset link has been sent."
    );
  }
);

/**
 * POST /api/v1/auth/reset-password/:token
 * Reset password using the token from email.
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.resetPassword(req.params.token as string, req.body);

    sendSuccess(
      res,
      null,
      200,
      "Password reset successful. Please log in with your new password."
    );
  }
);

/**
 * PUT /api/v1/auth/change-password
 * Change password for authenticated user.
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.changePassword(req.user!.id, req.body);

    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    sendSuccess(
      res,
      null,
      200,
      "Password changed successfully. Please log in again."
    );
  }
);

/**
 * GET /api/v1/auth/me
 * Get current authenticated user profile.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.user!.id);
  sendSuccess(res, { user });
});
