import { Website } from "../../models/Website.model";
import { AiReport, type IAiReport } from "../../models/AiReport.model";
import { User } from "../../models/User.model";
import { AppError } from "../../utils/AppError";
import { geminiService } from "../../services/gemini.service";
import { renderPrompt } from "../../services/prompt-template.service";
import type { AnalyzeCompetitorsInput } from "./competitors.validation";

/**
 * Run an AI-powered competitor analysis.
 * Compares the user's website against 1-5 competitor domains.
 */
export const analyzeCompetitors = async (
  userId: string,
  input: AnalyzeCompetitorsInput
): Promise<IAiReport> => {
  const website = await Website.findOne({
    _id: input.websiteId,
    userId,
  });

  if (!website) {
    throw new AppError("Website not found or you don't have access.", 404);
  }

  // Check daily report limit
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayReportCount = await AiReport.countDocuments({
    userId,
    createdAt: { $gte: todayStart },
  });

  if (todayReportCount >= user.subscription.dailyReportLimit) {
    throw new AppError(
      `Daily report limit reached (${user.subscription.dailyReportLimit}). Upgrade for more.`,
      429
    );
  }

  // Create report record
  const report = await AiReport.create({
    userId,
    reportType: "competitor_analysis",
    url: website.domain,
    status: "generating",
  });

  try {
    const prompt = renderPrompt("competitor-analysis", {
      domain: website.domain,
      competitors: input.competitorDomains.join(", "),
      analysisType: input.analysisType,
    });

    const { text, usage } = await geminiService.generateText(prompt, {
      useProModel: true,
    });

    let parsedResponse: Record<string, unknown> = {};
    try {
      parsedResponse = JSON.parse(text);
    } catch {
      parsedResponse = { rawText: text };
    }

    report.status = "completed";
    report.executiveSummary =
      (parsedResponse.executiveSummary as string) || "";
    report.rawResponse = parsedResponse;
    report.strengths = (parsedResponse.strengths as string[]) || [];
    report.contentRecommendations =
      (parsedResponse.recommendations as string[]) || [];
    report.tokenUsage = {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      model: usage.model,
      estimatedCostUsd: usage.estimatedCostUsd,
    };
    await report.save();

    return report;
  } catch (error: any) {
    report.status = "failed";
    report.errorMessage = error.message;
    await report.save();
    throw new AppError("Failed to generate competitor analysis.", 500);
  }
};

/**
 * Get competitor analysis reports for a website.
 */
export const getCompetitorReports = async (
  userId: string,
  websiteId: string,
  query: { page?: number; limit?: number }
): Promise<{
  reports: IAiReport[];
  total: number;
  page: number;
  limit: number;
}> => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  // Verify website ownership
  const website = await Website.findOne({ _id: websiteId, userId });
  if (!website) {
    throw new AppError("Website not found or you don't have access.", 404);
  }

  const filter = {
    userId,
    reportType: "competitor_analysis",
    url: website.domain,
  };

  const [reports, total] = await Promise.all([
    AiReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AiReport.countDocuments(filter),
  ]);

  return { reports: reports as unknown as IAiReport[], total, page, limit };
};
