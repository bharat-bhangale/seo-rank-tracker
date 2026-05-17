import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as controller from "./gsc.controller";
import {
  connectGscPropertySchema,
  gscAuthUrlSchema,
  performanceQuerySchema,
  syncGscPropertySchema,
} from "./gsc.validation";

const router = Router();

router.use(authenticate);

router.post("/auth-url", validate(gscAuthUrlSchema), controller.getAuthUrl);
router.post("/properties", validate(connectGscPropertySchema), controller.connectProperty);
router.get("/properties", controller.listProperties);
router.post(
  "/properties/:id/sync",
  validate(syncGscPropertySchema),
  controller.syncProperty
);
router.get(
  "/properties/:id/performance",
  validate(performanceQuerySchema, "query"),
  controller.getPerformance
);

export default router;
