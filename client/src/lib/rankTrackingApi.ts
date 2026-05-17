import api from "@/lib/api";

export interface Keyword {
  _id: string;
  domain: string;
  keyword: string;
  searchEngine: "google";
  locale: string;
  device: "desktop" | "mobile";
  group?: string;
  tags: string[];
  status: "active" | "paused";
  schedule: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
  lastPosition?: number;
  bestPosition?: number;
  lastUrl?: string;
  lastCheckedAt?: string;
  lastCheckStatus: "never_checked" | "queued" | "checking" | "completed" | "failed";
  lastCheckError?: string;
}

export interface RankCheck {
  _id: string;
  checkedAt: string;
  found: boolean;
  position?: number;
  previousPosition?: number;
  change?: number;
  url?: string;
  source: "browserbase" | "serpapi" | "manual";
  aiOverview: {
    present: boolean;
    citesDomain: boolean;
  };
  serpFeatures: Array<{
    type: string;
    owned: boolean;
    title?: string;
    url?: string;
  }>;
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface RankAlert {
  _id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  previousPosition?: number;
  currentPosition?: number;
  delta?: number;
  featureType?: string;
  readAt?: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface KeywordListResult {
  keywords: Keyword[];
  pagination: Pagination;
}

export interface NewKeywordInput {
  domain: string;
  keyword: string;
  locale: string;
  device: "desktop" | "mobile";
  group?: string;
  tags: string[];
  schedule: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
}

export interface FeatureSummaryRow {
  _id: {
    type: string;
    owned: boolean;
  };
  count: number;
}

export interface AiVisibilityStats {
  totalChecks: number;
  aiOverviewPresent: number;
  citesDomain: number;
  citationRate: number;
}

export const rankTrackingApi = {
  async listKeywords(): Promise<KeywordListResult> {
    const response = await api.get<{
      data: Keyword[];
      pagination: Pagination;
    }>("/keywords", { params: { limit: 100 } });

    return {
      keywords: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async createKeyword(input: NewKeywordInput): Promise<Keyword> {
    const response = await api.post<{ data: { keyword: Keyword } }>("/keywords", input);
    return response.data.data.keyword;
  },

  async deleteKeyword(keywordId: string): Promise<void> {
    await api.delete(`/keywords/${keywordId}`);
  },

  async queueRankCheck(keywordId: string): Promise<{ jobId?: string }> {
    const response = await api.post<{ data: { jobId?: string } }>(
      `/keywords/${keywordId}/check`,
      {}
    );
    return response.data.data;
  },

  async bulkImport(csvText: string): Promise<{
    imported: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const response = await api.post<{
      data: {
        imported: number;
        skipped: number;
        errors: Array<{ row: number; message: string }>;
      };
    }>("/keywords/bulk-import", { csvText });
    return response.data.data;
  },

  async getTrend(keywordId: string, days = 30): Promise<RankCheck[]> {
    const response = await api.get<{ data: { checks: RankCheck[] } }>(
      `/keywords/${keywordId}/trend`,
      { params: { days } }
    );
    return response.data.data.checks;
  },

  async getAlerts(): Promise<{ alerts: RankAlert[]; pagination: Pagination }> {
    const response = await api.get<{ data: RankAlert[]; pagination: Pagination }>(
      "/keywords/alerts",
      { params: { limit: 10 } }
    );
    return {
      alerts: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getFeatureSummary(): Promise<FeatureSummaryRow[]> {
    const response = await api.get<{ data: { summary: FeatureSummaryRow[] } }>(
      "/keywords/features/summary"
    );
    return response.data.data.summary;
  },

  async getAiVisibility(domain?: string): Promise<AiVisibilityStats> {
    const response = await api.get<{ data: AiVisibilityStats }>(
      "/keywords/ai-visibility",
      { params: domain ? { domain } : undefined }
    );
    return response.data.data;
  },

  async getGeoGrid(keywordId: string): Promise<RankCheck[]> {
    const response = await api.get<{ data: { checks: RankCheck[] } }>(
      `/keywords/${keywordId}/geo-grid`
    );
    return response.data.data.checks;
  },
};
