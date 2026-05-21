import api from "./api";

export interface CrawlConfig {
  websiteId: string;
  maxDepth?: number;
  maxPages?: number;
  respectRobotsTxt?: boolean;
  includeSubdomains?: boolean;
}

export interface CrawlResult {
  _id: string;
  domain: string;
  status: "pending" | "crawling" | "completed" | "failed";
  config: { maxDepth: number; maxPages: number };
  progress: { crawledPages: number; totalDiscovered: number; percentComplete: number };
  summary: {
    totalPages: number;
    brokenLinksCount: number;
    redirectChainsCount: number;
    orphanPagesCount: number;
    duplicateTitlesCount: number;
    duplicateDescriptionsCount: number;
    missingTitles: number;
    missingDescriptions: number;
    missingH1: number;
    averageLoadTimeMs: number;
    healthScore: number;
  };
  createdAt: string;
  completedAt?: string;
}

export interface CrawledPage {
  url: string;
  statusCode: number;
  title?: string;
  description?: string;
  h1?: string;
  contentLength: number;
  loadTimeMs: number;
  internalLinksCount: number;
  externalLinksCount: number;
  brokenLinks: string[];
  issues: Array<{ type: string; severity: string; message: string }>;
  depth: number;
}

export const siteCrawlerApi = {
  startCrawl: (data: CrawlConfig) => api.post("/crawl", data),

  getCrawl: (id: string) => api.get(`/crawl/${id}`),

  getCrawlHistory: (params?: { websiteId?: string; page?: number; limit?: number }) =>
    api.get("/crawl/history", { params }),

  getCrawlPages: (
    crawlId: string,
    params?: { page?: number; limit?: number; statusCode?: number; hasIssues?: boolean }
  ) => api.get(`/crawl/${crawlId}/pages`, { params }),
};
