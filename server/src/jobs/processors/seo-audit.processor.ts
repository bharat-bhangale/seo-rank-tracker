import type { Job } from "bullmq";
import type { SeoAuditJobData } from "../queues";
import { runAudit } from "../../modules/seo-analyzer/seo-analyzer.service";
import { createNotification } from "../../modules/notifications/notifications.service";
import { logger } from "../../utils/logger";

/**
 * Background processor for SEO audit jobs.
 * Runs the full audit pipeline and notifies the user on completion.
 */
export const processSeoAudit = async (
  job: Job<SeoAuditJobData>
): Promise<{ auditId: string }> => {
  const { userId, url, websiteId } = job.data;

  await job.updateProgress(10);
  logger.info(`Processing SEO audit: ${url}`);

  try {
    const audit = await runAudit(userId, { url, websiteId });
    await job.updateProgress(100);

    // Send notification on completion
    await createNotification(userId, {
      type: "audit_complete",
      title: "SEO Audit Complete",
      message: `Audit for ${url} scored ${audit.overallScore}/100 (${audit.grade})`,
      link: `/analyzer`,
      metadata: { auditId: audit.id, score: audit.overallScore },
    });

    return { auditId: audit.id };
  } catch (error: any) {
    logger.error(`SEO audit failed for ${url}: ${error.message}`);
    throw error;
  }
};
