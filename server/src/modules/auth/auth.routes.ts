import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { authLimiter } from "../../middleware/rateLimiter.middleware";
import * as authController from "./auth.controller";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth.validation";

const router = Router();

// ── Public Routes (rate-limited) ────────────────────────
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.post("/refresh", authController.refresh);

router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password/:token",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ── Protected Routes ────────────────────────────────────
router.post("/logout", authController.logout);

router.post("/logout-all", authenticate, authController.logoutAll);

router.get("/me", authenticate, authController.getMe);

router.put(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
