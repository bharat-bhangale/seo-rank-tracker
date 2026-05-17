import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as controller from "./backlinks.controller";
import {
  backlinkQuerySchema,
  competitorGapQuerySchema,
  syncBacklinksSchema,
  updateBacklinkSchema,
} from "./backlinks.validation";

const router = Router();

router.use(authenticate);

router.get("/", validate(backlinkQuerySchema, "query"), controller.getBacklinks);
router.get("/stats", controller.getStats);
router.post("/sync", validate(syncBacklinksSchema), controller.syncBacklinks);
router.get("/gap", validate(competitorGapQuerySchema, "query"), controller.getCompetitorGap);
router.get("/disavow", controller.downloadDisavow);
router.patch("/:id", validate(updateBacklinkSchema), controller.updateBacklink);

export default router;
