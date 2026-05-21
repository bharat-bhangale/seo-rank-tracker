import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../../utils/response";
import * as crawlerService from "./site-crawler.service";

/**
 * POST /api/v1/crawl
 * Start a new multi-page site crawl.
 */
export const startCrawl = asyncHandler(async (req: Request, res: Response) => {
  const crawl = await crawlerService.startCrawl(req.user!.id, req.body);
  sendSuccess(res, { crawl }, 201, "Crawl job created and queued for processing");
});

/**
 * GET /api/v1/crawl/:id
 * Get crawl results (summary, without individual pages).
 */
export const getCrawl = asyncHandler(async (req: Request, res: Response) => {
  const crawl = await crawlerService.getCrawlById(
    req.params.id as string,
    req.user!.id
  );
  sendSuccess(res, { crawl });
});

/**
 * GET /api/v1/crawl/history
 * Get crawl history for the authenticated user.
 */
export const getCrawlHistory = asyncHandler(async (req: Request, res: Response) => {
  const { crawls, total, page, limit } = await crawlerService.getCrawlHistory(
    req.user!.id,
    req.query as any
  );
  sendPaginated(res, crawls, total, page, limit);
});

/**
 * GET /api/v1/crawl/:id/pages
 * Get paginated crawled pages for a specific crawl.
 */
export const getCrawlPages = asyncHandler(async (req: Request, res: Response) => {
  const { pages, total, page, limit } = await crawlerService.getCrawlPages(
    req.params.id as string,
    req.user!.id,
    req.query as any
  );
  sendPaginated(res, pages, total, page, limit);
});
