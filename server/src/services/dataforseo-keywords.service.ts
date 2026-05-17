import axios from "axios";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

const api = axios.create({
  baseURL: "https://api.dataforseo.com/v3",
});

api.interceptors.request.use((config) => {
  if (env.DATAFORSEO_LOGIN && env.DATAFORSEO_PASSWORD) {
    const auth = Buffer.from(`${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`).toString("base64");
    config.headers.Authorization = `Basic ${auth}`;
  }
  return config;
});

export interface KeywordIdea {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number; // 0 to 1
  keyword_difficulty: number; // 0 to 100
  search_intent: "informational" | "navigational" | "commercial" | "transactional";
}

export const dataForSeoKeywordsService = {
  async getKeywordIdeas(seedKeyword: string, limit = 50): Promise<KeywordIdea[]> {
    if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) {
      // Mock for development if credentials aren't set
      logger.warn("DataForSEO credentials missing, returning mock keyword ideas");
      return Array.from({ length: 15 }).map((_, i) => {
        const intents: ("informational" | "navigational" | "commercial" | "transactional")[] = [
          "informational", "navigational", "commercial", "transactional"
        ];
        return {
          keyword: `${seedKeyword} idea ${i + 1}`,
          search_volume: Math.floor(Math.random() * 50000) + 100,
          cpc: Number((Math.random() * 10).toFixed(2)),
          competition: Number(Math.random().toFixed(2)),
          keyword_difficulty: Math.floor(Math.random() * 100),
          search_intent: intents[Math.floor(Math.random() * intents.length)],
        };
      });
    }

    try {
      const response = await api.post("/dataforseo_labs/google/keyword_suggestions/live", [
        {
          keyword: seedKeyword,
          location_name: "United States",
          language_name: "English",
          limit,
        },
      ]);

      const items = response.data.tasks?.[0]?.result?.[0]?.items || [];
      return items.map((item: any) => {
        // Derive intent manually or use DataForSEO intent feature
        const intentArray = item.keyword_info?.search_intent_info?.main_intent;
        let searchIntent = "informational";
        if (intentArray === "transactional") searchIntent = "transactional";
        if (intentArray === "commercial") searchIntent = "commercial";
        if (intentArray === "navigational") searchIntent = "navigational";

        return {
          keyword: item.keyword,
          search_volume: item.keyword_info?.search_volume || 0,
          cpc: item.keyword_info?.cpc || 0,
          competition: item.keyword_info?.competition || 0,
          keyword_difficulty: item.keyword_properties?.keyword_difficulty || 0,
          search_intent: searchIntent as any,
        };
      });
    } catch (error) {
      logger.error("DataForSEO getKeywordIdeas error", error);
      throw new AppError("Failed to fetch keyword ideas", 502);
    }
  },

  async getRankedKeywords(domain: string, limit = 50): Promise<any[]> {
    if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) {
      logger.warn("DataForSEO credentials missing, returning mock ranked keywords");
      return Array.from({ length: limit }).map((_, i) => ({
        keyword: `competitor term ${i + 1}`,
        search_volume: Math.floor(Math.random() * 20000) + 50,
        keyword_difficulty: Math.floor(Math.random() * 100),
        rank_absolute: Math.floor(Math.random() * 50) + 1,
      }));
    }

    try {
      const response = await api.post("/dataforseo_labs/google/ranked_keywords/live", [
        {
          target: domain,
          location_name: "United States",
          language_name: "English",
          limit,
        },
      ]);
      const items = response.data.tasks?.[0]?.result?.[0]?.items || [];
      return items.map((item: any) => ({
        keyword: item.keyword_data?.keyword,
        search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
        keyword_difficulty: item.keyword_data?.keyword_properties?.keyword_difficulty || 0,
        rank_absolute: item.ranked_serp_element?.rank_absolute || 100,
      }));
    } catch (error) {
      logger.error("DataForSEO getRankedKeywords error", error);
      throw new AppError("Failed to fetch ranked keywords for gap analysis", 502);
    }
  }
};
