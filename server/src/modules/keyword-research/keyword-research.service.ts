import { z } from "zod";
import { dataForSeoKeywordsService } from "../../services/dataforseo-keywords.service";
import { geminiService } from "../../services/gemini.service";
import { TopicCluster } from "../../models/TopicCluster.model";
import { Keyword } from "../../models/Keyword.model";
import { normalizeDomain } from "../../utils/domain";
import type { GenerateClusterInput, KeywordGapQuery, KeywordIdeaQuery, VisibilityScoreQuery } from "./keyword-research.validation";

export const getKeywordIdeas = async (query: KeywordIdeaQuery) => {
  const ideas = await dataForSeoKeywordsService.getKeywordIdeas(query.seed, query.limit);
  return ideas;
};

export const getKeywordGap = async (userId: string, query: KeywordGapQuery) => {
  const targetDomain = normalizeDomain(query.domain);
  const competitors = query.competitors.map(normalizeDomain);

  // Fetch ranked keywords for target
  const targetKeywords = await dataForSeoKeywordsService.getRankedKeywords(targetDomain, 100);
  const targetKeywordMap = new Map(targetKeywords.map(k => [k.keyword, k]));

  // Fetch ranked keywords for competitors
  const competitorKeywordsList = await Promise.all(
    competitors.map(async (comp) => {
      try {
        const kws = await dataForSeoKeywordsService.getRankedKeywords(comp, 100);
        return { domain: comp, keywords: kws };
      } catch (e) {
        return { domain: comp, keywords: [] };
      }
    })
  );

  const opportunities: Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    targetRank: number | null;
    competitorRanks: Record<string, number | null>;
    status: "missing" | "weak" | "strong";
  }> = [];

  const uniqueKeywords = new Set<string>();
  competitorKeywordsList.forEach(c => c.keywords.forEach(k => uniqueKeywords.add(k.keyword)));

  uniqueKeywords.forEach(keyword => {
    const targetData = targetKeywordMap.get(keyword);
    const targetRank = targetData?.rank_absolute || null;

    const competitorRanks: Record<string, number | null> = {};
    let searchVolume = targetData?.search_volume || 0;
    let difficulty = targetData?.keyword_difficulty || 0;
    let anyCompetitorRanksHigher = false;

    competitorKeywordsList.forEach(comp => {
      const compData = comp.keywords.find(k => k.keyword === keyword);
      competitorRanks[comp.domain] = compData?.rank_absolute || null;
      if (compData) {
        searchVolume = Math.max(searchVolume, compData.search_volume || 0);
        difficulty = Math.max(difficulty, compData.keyword_difficulty || 0);
        if (compData.rank_absolute && (!targetRank || compData.rank_absolute < targetRank)) {
          anyCompetitorRanksHigher = true;
        }
      }
    });

    let status: "missing" | "weak" | "strong" = "missing";
    if (targetRank) {
      status = anyCompetitorRanksHigher ? "weak" : "strong";
    }

    if (status !== "strong") {
      opportunities.push({
        keyword,
        searchVolume,
        difficulty,
        targetRank,
        competitorRanks,
        status,
      });
    }
  });

  return opportunities.sort((a, b) => b.searchVolume - a.searchVolume).slice(0, query.limit);
};

export const generateTopicClusters = async (userId: string, input: GenerateClusterInput) => {
  const prompt = `Group the following SEO keywords into logical semantic topic clusters. Each cluster should have a main "pillarTopic" and a list of "subTopics" (which are the keywords belonging to that cluster).
  
  Keywords:
  ${input.keywords.join(", ")}
  `;

  const clusterSchema = z.object({
    clusters: z.array(
      z.object({
        pillarTopic: z.string(),
        subTopics: z.array(z.string()),
      })
    ),
  });

  const { data } = await geminiService.generateStructured(prompt, clusterSchema, { useProModel: true });

  const savedClusters = await Promise.all(
    data.clusters.map(async (cluster) => {
      // Find volume data for subtopics from dataforseo ideas API
      const subTopicPromises = cluster.subTopics.map(async (kw) => {
        const ideas = await dataForSeoKeywordsService.getKeywordIdeas(kw, 1);
        const match = ideas.find(i => i.keyword === kw) || ideas[0];
        return {
          keyword: kw,
          searchVolume: match?.search_volume || 0,
          difficulty: match?.keyword_difficulty || 0,
          intent: match?.search_intent || "informational",
        };
      });

      const subTopicsData = await Promise.all(subTopicPromises);
      const overallVolume = subTopicsData.reduce((acc, curr) => acc + curr.searchVolume, 0);

      const topicCluster = await TopicCluster.create({
        userId,
        pillarTopic: cluster.pillarTopic,
        subTopics: subTopicsData,
        overallVolume,
        coveragePercentage: 0,
      });

      return topicCluster;
    })
  );

  return savedClusters;
};

export const getClusters = async (userId: string) => {
  return TopicCluster.find({ userId }).sort({ overallVolume: -1 }).lean();
};

const ESTIMATED_CTR: Record<number, number> = {
  1: 0.317,
  2: 0.247,
  3: 0.186,
  4: 0.136,
  5: 0.095,
  6: 0.062,
  7: 0.041,
  8: 0.031,
  9: 0.021,
  10: 0.011,
};

export const getVisibilityScore = async (userId: string, query: VisibilityScoreQuery) => {
  const domain = normalizeDomain(query.domain);
  const keywords = await Keyword.find({ domain, userId, "lastCheckStatus": "completed" }).lean();
  
  let totalMarketVisibility = 0;
  let yourVisibility = 0;

  keywords.forEach((kw) => {
    // We assume an average volume since we didn't store volume in Keyword model directly
    // Let's mock a fixed volume for calculation, or fetch from DB if available.
    // Assuming we have a mock volume of 1000 for calculation if missing
    const volume = 1000;
    
    totalMarketVisibility += volume * ESTIMATED_CTR[1]; // Market max visibility is being #1 for everything

    const rank = kw.lastPosition || 100;
    if (rank >= 1 && rank <= 10) {
      yourVisibility += volume * (ESTIMATED_CTR[rank] || 0);
    }
  });

  const shareOfVoice = totalMarketVisibility > 0 ? (yourVisibility / totalMarketVisibility) * 100 : 0;

  return {
    visibilityScore: Math.round(yourVisibility),
    shareOfVoice: Number(shareOfVoice.toFixed(2)),
    totalKeywords: keywords.length,
    keywordsInTop3: keywords.filter(k => k.lastPosition && k.lastPosition <= 3).length,
    keywordsInTop10: keywords.filter(k => k.lastPosition && k.lastPosition <= 10).length,
  };
};
