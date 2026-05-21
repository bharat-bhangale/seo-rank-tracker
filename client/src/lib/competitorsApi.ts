import api from "./api";

export const competitorsApi = {
  analyze: (data: {
    websiteId: string;
    competitorDomains: string[];
    analysisType?: "full" | "content_gap" | "keyword_gap" | "backlink_gap";
  }) => api.post("/competitors/analyze", data),

  getReports: (websiteId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/competitors/${websiteId}`, { params }),
};
