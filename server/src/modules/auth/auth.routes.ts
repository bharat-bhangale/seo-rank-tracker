import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
// import { authLimiter } from "../../middleware/rateLimiter.middleware"; // Phase 8: Rate limiting — uncomment for production
import * as authController from "./auth.controller";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth.validation";

const router = Router();

// ── Public Routes ────────────────────────────────────────
router.post(
  "/register",
  // authLimiter, // Phase 8: Rate limiting — uncomment for production
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  // authLimiter, // Phase 8: Rate limiting — uncomment for production
  validate(loginSchema),
  authController.login
);

router.post("/refresh", authController.refresh);

router.post(
  "/forgot-password",
  // authLimiter, // Phase 8: Rate limiting — uncomment for production
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password/:token",
  // authLimiter, // Phase 8: Rate limiting — uncomment for production
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
