import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as crawlerController from "./site-crawler.controller";
import {
  startCrawlSchema,
  getCrawlSchema,
  getCrawlPagesSchema,
} from "./site-crawler.validation";

const router = Router();

// All crawler routes require authentication
router.use(authenticate);

// Start a new site crawl
router.post("/", validate(startCrawlSchema), crawlerController.startCrawl);

// Get crawl history
router.get(
  "/history",
  validate(getCrawlSchema, "query"),
  crawlerController.getCrawlHistory
);

// Get crawl result by ID
router.get("/:id", crawlerController.getCrawl);

// Get crawled pages for a crawl
router.get(
  "/:id/pages",
  validate(getCrawlPagesSchema, "query"),
  crawlerController.getCrawlPages
);

export default router;
