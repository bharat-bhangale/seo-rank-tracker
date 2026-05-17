import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../../utils/response";
import * as analyzerService from "./seo-analyzer.service";

/**
 * POST /api/v1/analyzer/audit
 * Run a new SEO audit on a URL.
 */
export const runAudit = asyncHandler(async (req: Request, res: Response) => {
  const audit = await analyzerService.runAudit(req.user!.id, req.body);
  sendSuccess(res, { audit }, 201, "SEO audit completed successfully");
});

/**
 * GET /api/v1/analyzer/audit/:id
 * Get a specific audit result by ID.
 */
export const getAudit = asyncHandler(async (req: Request, res: Response) => {
  const audit = await analyzerService.getAuditById(
    req.params.id as string,
    req.user!.id
  );
  sendSuccess(res, { audit });
});

/**
 * GET /api/v1/analyzer/history
 * Get paginated audit history.
 */
export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const { audits, total, page, limit } = await analyzerService.getAuditHistory(
    req.user!.id,
    req.query as any
  );
  sendPaginated(res, audits, total, page, limit);
});
