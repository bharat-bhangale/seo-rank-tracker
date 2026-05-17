import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./export.controller";

const router = Router();

router.use(authenticate);

router.get("/csv/keywords", controller.exportKeywordsCsv);
router.get("/csv/backlinks", controller.exportBacklinksCsv);

export default router;
