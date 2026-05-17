import api from "@/lib/api";
import type { Pagination } from "./rankTrackingApi";

export interface Backlink {
  _id: string;
  domainFrom: string;
  urlFrom: string;
  urlTo: string;
  anchorText: string;
  isDofollow: boolean;
  spamScore: number;
  domainRank: number;
  pageRank: number;
  isLost: boolean;
  isNewlyDiscovered: boolean;
  toxicityScore: number;
  toxicityStatus: "safe" | "suspicious" | "toxic";
  disavowed: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface DomainBacklinkStats {
  _id: string;
  domain: string;
  date: string;
  totalBacklinks: number;
  referringDomains: number;
  dofollowBacklinks: number;
  domainRank: number;
  spamScore: number;
  newBacklinks: number;
  lostBacklinks: number;
}

export interface CompetitorGapOpportunity {
  domain: string;
  linkedCompetitors: string[];
  count: number;
}

export const backlinksApi = {
  async getBacklinks(params: { domain: string; page?: number; limit?: number; status?: string; sort?: string; order?: string }) {
    const response = await api.get<{ data: Backlink[]; pagination: Pagination }>("/backlinks", { params });
    return response.data;
  },

  async updateBacklink(id: string, data: { disavowed?: boolean; toxicityStatus?: "safe" | "suspicious" | "toxic" }) {
    const response = await api.patch<{ data: Backlink }>(`/backlinks/${id}`, data);
    return response.data.data;
  },

  async getStats(domain: string) {
    const response = await api.get<{ data: { latestStats: DomainBacklinkStats; trend: DomainBacklinkStats[] } }>(
      "/backlinks/stats",
      { params: { domain } }
    );
    return response.data.data;
  },

  async syncBacklinks(domain: string) {
    const response = await api.post<{ data: { jobId: string } }>("/backlinks/sync", { domain });
    return response.data.data;
  },

  async getCompetitorGap(domain: string, competitors: string[]) {
    const response = await api.get<{ data: { opportunities: CompetitorGapOpportunity[] } }>("/backlinks/gap", {
      params: { domain, competitors: competitors.join(",") },
    });
    return response.data.data;
  },

  getDisavowDownloadUrl(domain: string) {
    // Return the URL for downloading the file directly
    return `/api/v1/backlinks/disavow?domain=${encodeURIComponent(domain)}`;
  },
};
