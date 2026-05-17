import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as controller from "./ai-reports.controller";
import {
  generateSeoReportSchema,
  generateContentBriefSchema,
  scoreContentSchema,
  analyzeCompetitorsSchema,
  getReportHistorySchema,
} from "./ai-reports.validation";

const router = Router();

// All AI report routes require authentication
router.use(authenticate);

// ── Report Generation ──────────────────────────────────

// Generate AI SEO report from an existing audit
router.post(
  "/reports/seo",
  validate(generateSeoReportSchema),
  controller.generateSeoReport
);

// Generate AI content brief for a keyword
router.post(
  "/reports/content-brief",
  validate(generateContentBriefSchema),
  controller.generateContentBrief
);

// Score existing content against SEO best practices
router.post(
  "/reports/content-score",
  validate(scoreContentSchema),
  controller.scoreContent
);

// Analyze competitor websites
router.post(
  "/reports/competitor-analysis",
  validate(analyzeCompetitorsSchema),
  controller.analyzeCompetitors
);

// ── Report Retrieval ───────────────────────────────────

// Get report history (with optional type filter)
router.get(
  "/reports/history",
  validate(getReportHistorySchema, "query"),
  controller.getHistory
);

// Get AI usage statistics
router.get("/usage", controller.getUsage);

// Get a specific report by ID (must come after /history to avoid conflicts)
router.get("/reports/:id", controller.getReport);

export default router;
