import axios from "axios";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

const api = axios.create({
  baseURL: "https://api.dataforseo.com/v3",
});

api.interceptors.request.use((config) => {
  if (env.DATAFORSEO_LOGIN && env.DATAFORSEO_PASSWORD) {
    const auth = Buffer.from(
      `${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`
    ).toString("base64");
    config.headers.Authorization = `Basic ${auth}`;
  }
  return config;
});

export interface DataForSeoBacklink {
  type: string;
  domain_from: string;
  url_from: string;
  url_from_https: boolean;
  domain_to: string;
  url_to: string;
  url_to_https: boolean;
  tld_from: string;
  is_new: boolean;
  is_lost: boolean;
  backlink_spam_score: number;
  rank: number;
  domain_from_rank: number;
  item_type: string;
  anchor: string;
  dofollow: boolean;
  page_from_title?: string;
  first_seen?: string;
  last_seen?: string;
  status?: string;
}

export interface BacklinkSummary {
  total_backlinks: number;
  referring_domains: number;
  referring_main_domains: number;
  referring_ips: number;
  referring_subnets: number;
  referring_pages: number;
  dofollow: number;
  rank: number;
  backlinks_spam_score: number;
}

export const dataForSeoService = {
  async getBacklinkSummary(target: string): Promise<BacklinkSummary> {
    if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) {
      // Mock for development if credentials aren't set
      logger.warn("DataForSEO credentials missing, returning mock backlink summary");
      return {
        total_backlinks: Math.floor(Math.random() * 10000) + 500,
        referring_domains: Math.floor(Math.random() * 500) + 50,
        referring_main_domains: Math.floor(Math.random() * 400) + 40,
        referring_ips: Math.floor(Math.random() * 450) + 40,
        referring_subnets: Math.floor(Math.random() * 300) + 30,
        referring_pages: Math.floor(Math.random() * 5000) + 100,
        dofollow: Math.floor(Math.random() * 8000) + 400,
        rank: Math.floor(Math.random() * 80) + 20,
        backlinks_spam_score: Math.floor(Math.random() * 20) + 1,
      };
    }

    try {
      const response = await api.post("/backlinks/summary/live", [
        {
          target,
          internal_list_limit: 1,
        },
      ]);
      const result = response.data.tasks?.[0]?.result?.[0];
      if (!result) throw new Error("No result from DataForSEO");
      return result;
    } catch (error) {
      logger.error("DataForSEO getBacklinkSummary error", error);
      throw new AppError("Failed to fetch backlink summary from DataForSEO", 502);
    }
  },

  async getBacklinks(target: string, limit = 100): Promise<DataForSeoBacklink[]> {
    if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) {
      // Mock for development
      logger.warn("DataForSEO credentials missing, returning mock backlinks");
      return Array.from({ length: 10 }).map((_, i) => ({
        type: "anchor",
        domain_from: `example-${i}.com`,
        url_from: `https://example-${i}.com/post/${i}`,
        url_from_https: true,
        domain_to: target,
        url_to: `https://${target}/target-page`,
        url_to_https: true,
        tld_from: "com",
        is_new: i < 2,
        is_lost: i === 3,
        backlink_spam_score: Math.floor(Math.random() * 100),
        rank: Math.floor(Math.random() * 100),
        domain_from_rank: Math.floor(Math.random() * 100),
        item_type: "anchor",
        anchor: `Keyword ${i}`,
        dofollow: i % 3 !== 0,
        first_seen: new Date(Date.now() - 100000000).toISOString(),
        last_seen: new Date().toISOString(),
      }));
    }

    try {
      const response = await api.post("/backlinks/backlinks/live", [
        {
          target,
          limit,
          order_by: ["rank,desc"],
        },
      ]);
      const items = response.data.tasks?.[0]?.result?.[0]?.items || [];
      return items;
    } catch (error) {
      logger.error("DataForSEO getBacklinks error", error);
      throw new AppError("Failed to fetch backlinks from DataForSEO", 502);
    }
  },
};
