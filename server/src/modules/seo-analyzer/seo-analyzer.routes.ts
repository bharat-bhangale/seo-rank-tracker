import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as analyzerController from "./seo-analyzer.controller";
import { runAuditSchema, getAuditHistorySchema } from "./seo-analyzer.validation";

const router = Router();

// All analyzer routes require authentication
router.use(authenticate);

// Run a new SEO audit
router.post("/audit", validate(runAuditSchema), analyzerController.runAudit);

// Get a specific audit by ID
router.get("/audit/:id", analyzerController.getAudit);

// Get audit history (with optional filters)
router.get(
  "/history",
  validate(getAuditHistorySchema, "query"),
  analyzerController.getHistory
);

export default router;
