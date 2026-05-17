import api from "@/lib/api";

export interface KeywordIdea {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  keyword_difficulty: number;
  search_intent: "informational" | "navigational" | "commercial" | "transactional";
}

export interface KeywordGapOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  targetRank: number | null;
  competitorRanks: Record<string, number | null>;
  status: "missing" | "weak" | "strong";
}

export interface TopicCluster {
  _id: string;
  pillarTopic: string;
  subTopics: Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    intent: string;
    publishedUrl?: string;
  }>;
  overallVolume: number;
  coveragePercentage: number;
  createdAt: string;
}

export interface VisibilityStats {
  visibilityScore: number;
  shareOfVoice: number;
  totalKeywords: number;
  keywordsInTop3: number;
  keywordsInTop10: number;
}

export const keywordResearchApi = {
  async getIdeas(seed: string, limit = 50) {
    const response = await api.get<{ data: KeywordIdea[] }>("/research/ideas", { params: { seed, limit } });
    return response.data.data;
  },

  async getGap(domain: string, competitors: string[], limit = 50) {
    const response = await api.get<{ data: KeywordGapOpportunity[] }>("/research/gap", {
      params: { domain, competitors: competitors.join(","), limit },
    });
    return response.data.data;
  },

  async generateClusters(keywords: string[]) {
    const response = await api.post<{ data: TopicCluster[] }>("/research/clusters/generate", { keywords });
    return response.data.data;
  },

  async getClusters() {
    const response = await api.get<{ data: TopicCluster[] }>("/research/clusters");
    return response.data.data;
  },

  async getVisibility(domain: string) {
    const response = await api.get<{ data: VisibilityStats }>("/research/visibility", { params: { domain } });
    return response.data.data;
  },
};
