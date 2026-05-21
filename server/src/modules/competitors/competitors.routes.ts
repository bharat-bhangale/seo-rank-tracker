import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as competitorsController from "./competitors.controller";
import { analyzeCompetitorsSchema } from "./competitors.validation";

const router = Router();

// All competitor routes require authentication
router.use(authenticate);

// Run competitor analysis
router.post(
  "/analyze",
  validate(analyzeCompetitorsSchema),
  competitorsController.analyzeCompetitors
);

// Get competitor reports for a website
router.get("/:websiteId", competitorsController.getCompetitorReports);

export default router;
