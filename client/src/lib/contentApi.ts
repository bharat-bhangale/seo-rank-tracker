import api from "./api";

export const contentApi = {
  generateBrief: (data: { keyword: string; websiteId?: string; targetUrl?: string; locale?: string }) =>
    api.post("/content/brief", data),

  scoreContent: (data: { keyword: string; content: string; url?: string }) =>
    api.post("/content/score", data),

  getTopicClusters: (websiteId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/content/clusters/${websiteId}`, { params }),

  generateCluster: (websiteId: string, keyword: string) =>
    api.post(`/content/clusters/${websiteId}`, { keyword }),
};
