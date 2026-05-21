import { AiReport, type IAiReport } from "../../models/AiReport.model";
import { TopicCluster, type ITopicCluster } from "../../models/TopicCluster.model";
import { User } from "../../models/User.model";
import { AppError } from "../../utils/AppError";
import { geminiService } from "../../services/gemini.service";
import { renderPrompt } from "../../services/prompt-template.service";
import type {
  GenerateBriefInput,
  ScoreContentInput,
  GetTopicClustersInput,
} from "./content.validation";

/**
 * Generate an AI content brief for a target keyword.
 * Analyzes top-ranking content and generates a structured brief via Gemini.
 */
export const generateContentBrief = async (
  userId: string,
  input: GenerateBriefInput
): Promise<IAiReport> => {
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
      `Daily report limit reached (${user.subscription.dailyReportLimit}). Upgrade your plan for more reports.`,
      429
    );
  }

  // Create the report record (status: generating)
  const report = await AiReport.create({
    userId,
    reportType: "content_brief",
    keyword: input.keyword,
    status: "generating",
  });

  try {
    // Build prompt from template
    const prompt = renderPrompt("content-brief", {
      keyword: input.keyword,
      locale: input.locale,
      language: input.language,
      targetUrl: input.targetUrl || "N/A",
    });

    // Generate content brief via Gemini
    const { text, usage } = await geminiService.generateText(prompt, {
      useProModel: true,
    });

    // Update report with AI response
    let parsedResponse: Record<string, unknown> = {};
    try {
      parsedResponse = JSON.parse(text);
    } catch {
      parsedResponse = { rawText: text };
    }

    report.status = "completed";
    report.executiveSummary =
      (parsedResponse.executiveSummary as string) || text.substring(0, 500);
    report.rawResponse = parsedResponse;
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
    throw new AppError("Failed to generate content brief. Please try again.", 500);
  }
};

/**
 * Score existing content against target keyword.
 * Analyzes topical coverage, structure, and readability.
 */
export const scoreContent = async (
  userId: string,
  input: ScoreContentInput
): Promise<IAiReport> => {
  const report = await AiReport.create({
    userId,
    reportType: "content_optimization",
    keyword: input.keyword,
    url: input.url,
    status: "generating",
  });

  try {
    const prompt = renderPrompt("content-optimizer", {
      keyword: input.keyword,
      content: input.content.substring(0, 15_000), // Limit content length
      url: input.url || "N/A",
    });

    const { text, usage } = await geminiService.generateText(prompt, {
      useProModel: false, // Use Flash for speed on scoring
    });

    let parsedResponse: Record<string, unknown> = {};
    try {
      parsedResponse = JSON.parse(text);
    } catch {
      parsedResponse = { rawText: text };
    }

    report.status = "completed";
    report.rawResponse = parsedResponse;
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
    throw new AppError("Failed to score content. Please try again.", 500);
  }
};

/**
 * Get topic clusters for a website.
 */
export const getTopicClusters = async (
  userId: string,
  input: GetTopicClustersInput
): Promise<{
  clusters: ITopicCluster[];
  total: number;
  page: number;
  limit: number;
}> => {
  const { page, limit, websiteId } = input;
  const skip = (page - 1) * limit;

  const filter = { userId, websiteId };

  const [clusters, total] = await Promise.all([
    TopicCluster.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TopicCluster.countDocuments(filter),
  ]);

  return { clusters: clusters as unknown as ITopicCluster[], total, page, limit };
};

/**
 * Generate topic clusters for a seed keyword using Gemini AI.
 */
export const generateTopicCluster = async (
  userId: string,
  websiteId: string,
  seedKeyword: string
): Promise<ITopicCluster> => {
  try {
    const prompt = renderPrompt("topic-cluster", {
      seedKeyword,
    });

    const { text } = await geminiService.generateText(prompt, {
      useProModel: false,
    });

    let aiData: Record<string, any> = {};
    try {
      aiData = JSON.parse(text);
    } catch {
      aiData = { pillarTopic: seedKeyword, subTopics: [] };
    }

    const cluster = await TopicCluster.create({
      userId,
      websiteId,
      pillarTopic: aiData.pillarTopic || seedKeyword,
      subTopics: (aiData.subTopics || []).map((st: any) => ({
        keyword: st.keyword || "",
        searchVolume: st.searchVolume || 0,
        difficulty: st.difficulty || 0,
        intent: st.intent || "informational",
      })),
      overallVolume: aiData.overallVolume || 0,
      coveragePercentage: 0,
    });

    return cluster;
  } catch (error: any) {
    throw new AppError("Failed to generate topic cluster.", 500);
  }
};
