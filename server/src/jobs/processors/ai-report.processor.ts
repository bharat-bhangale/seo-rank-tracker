import type { Job } from "bullmq";
import type { AiReportJobData } from "../queues";
import { AiReport } from "../../models/AiReport.model";
import { SeoAudit } from "../../models/SeoAudit.model";
import { geminiService } from "../../services/gemini.service";
import { renderPrompt } from "../../services/prompt-template.service";
import { createNotification } from "../../modules/notifications/notifications.service";
import { logger } from "../../utils/logger";

/**
 * Background processor for AI report generation.
 * Generates comprehensive SEO report from audit data using Gemini AI.
 */
export const processAiReport = async (
  job: Job<AiReportJobData>
): Promise<{ reportId: string }> => {
  const { reportId, userId } = job.data;

  await job.updateProgress(10);
  logger.info(`Processing AI report: ${reportId}`);

  const report = await AiReport.findById(reportId);
  if (!report) {
    throw new Error(`Report ${reportId} not found`);
  }

  try {
    // Fetch audit data if linked
    let auditData: Record<string, unknown> = {};
    if (report.auditId) {
      const audit = await SeoAudit.findById(report.auditId).lean();
      if (audit) {
        auditData = {
          url: audit.url,
          overallScore: audit.overallScore,
          grade: audit.grade,
          checks: audit.checks,
          categoryScores: audit.categoryScores,
          pageData: audit.pageData,
        };
      }
    }

    await job.updateProgress(30);

    // Build the appropriate prompt
    const templateName =
      report.reportType === "seo_report"
        ? "seo-report"
        : report.reportType === "content_brief"
          ? "content-brief"
          : report.reportType === "content_optimization"
            ? "content-optimizer"
            : "competitor-analysis";

    const prompt = renderPrompt(templateName, {
      url: report.url || auditData.url || "",
      keyword: report.keyword || "",
      auditDate: new Date().toISOString(),
      ...auditData,
    });

    await job.updateProgress(50);

    // Generate with Gemini
    const { text, usage } = await geminiService.generateText(prompt, {
      useProModel: true,
    });

    await job.updateProgress(80);

    // Parse response
    let parsedResponse: Record<string, unknown> = {};
    try {
      parsedResponse = JSON.parse(text);
    } catch {
      parsedResponse = { rawText: text };
    }

    // Update report
    report.status = "completed";
    report.executiveSummary =
      (parsedResponse.executiveSummary as string) || text.substring(0, 500);
    report.overallAssessment =
      (parsedResponse.overallAssessment as string) || "";
    report.rawResponse = parsedResponse;
    report.prioritizedActions = (parsedResponse.prioritizedActions as any[]) || [];
    report.strengths = (parsedResponse.strengths as string[]) || [];
    report.technicalRoadmap = (parsedResponse.technicalRoadmap as any[]) || [];
    report.contentRecommendations =
      (parsedResponse.contentRecommendations as string[]) || [];
    report.tokenUsage = {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      model: usage.model,
      estimatedCostUsd: usage.estimatedCostUsd,
    };
    await report.save();

    await job.updateProgress(100);

    // Notify user
    await createNotification(userId, {
      type: "report_ready",
      title: "AI Report Ready",
      message: `Your ${report.reportType.replace(/_/g, " ")} report is ready to view.`,
      link: `/reports`,
      metadata: { reportId: report.id },
    });

    return { reportId: report.id };
  } catch (error: any) {
    report.status = "failed";
    report.errorMessage = error.message;
    await report.save();
    logger.error(`AI report generation failed: ${error.message}`);
    throw error;
  }
};
