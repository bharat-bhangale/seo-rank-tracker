import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as controller from "./rank-tracking.controller";
import {
  alertQuerySchema,
  bulkImportSchema,
  createKeywordSchema,
  geoGridCheckSchema,
  keywordListQuerySchema,
  manualCheckSchema,
  trendQuerySchema,
  updateKeywordSchema,
} from "./rank-tracking.validation";

const router = Router();

router.use(authenticate);

router.get("/", validate(keywordListQuerySchema, "query"), controller.getKeywords);
router.post("/", validate(createKeywordSchema), controller.createKeyword);
router.post("/bulk-import", validate(bulkImportSchema), controller.bulkImport);

router.get("/alerts", validate(alertQuerySchema, "query"), controller.getAlerts);
router.patch("/alerts/:alertId/read", controller.markAlertRead);
router.get("/features/summary", controller.getFeatureSummary);
router.get("/ai-visibility", controller.getAiVisibility);

router.get("/:id", controller.getKeyword);
router.put("/:id", validate(updateKeywordSchema), controller.updateKeyword);
router.delete("/:id", controller.deleteKeyword);
router.post("/:id/check", validate(manualCheckSchema), controller.manualCheck);
router.get("/:id/trend", validate(trendQuerySchema, "query"), controller.getTrend);
router.post("/:id/geo-grid", validate(geoGridCheckSchema), controller.enqueueGeoGrid);
router.get("/:id/geo-grid", controller.getGeoGrid);

export default router;
