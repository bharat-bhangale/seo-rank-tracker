import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./analytics.controller";

const router = Router();

router.use(authenticate);

router.get("/dashboard", controller.getDashboard);
router.get("/notifications", controller.getNotifications);
router.patch("/notifications/:id/read", controller.markNotificationRead);

export default router;
