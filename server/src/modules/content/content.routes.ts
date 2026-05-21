import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as contentController from "./content.controller";
import { generateBriefSchema, scoreContentSchema } from "./content.validation";

const router = Router();

// All content routes require authentication
router.use(authenticate);

// Generate an AI content brief
router.post("/brief", validate(generateBriefSchema), contentController.generateBrief);

// Score existing content
router.post("/score", validate(scoreContentSchema), contentController.scoreContent);

// Get topic clusters for a website
router.get("/clusters/:websiteId", contentController.getTopicClusters);

// Generate a new topic cluster
router.post("/clusters/:websiteId", contentController.generateCluster);

export default router;
