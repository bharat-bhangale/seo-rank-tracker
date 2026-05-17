import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as controller from "./keyword-research.controller";
import {
  generateClusterSchema,
  keywordGapQuerySchema,
  keywordIdeaQuerySchema,
  visibilityScoreQuerySchema,
} from "./keyword-research.validation";

const router = Router();

router.use(authenticate);

router.get("/ideas", validate(keywordIdeaQuerySchema, "query"), controller.getKeywordIdeas);
router.get("/gap", validate(keywordGapQuerySchema, "query"), controller.getKeywordGap);
router.post("/clusters/generate", validate(generateClusterSchema), controller.generateClusters);
router.get("/clusters", controller.getClusters);
router.get("/visibility", validate(visibilityScoreQuerySchema, "query"), controller.getVisibilityScore);

export default router;
