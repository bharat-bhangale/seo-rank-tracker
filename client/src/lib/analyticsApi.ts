import api from "./api";

export interface DashboardKPIs {
  totalKeywords: number;
  avgPosition: number;
  visibilityScore: number;
  keywordsInTop10: number;
  keywordsInTop3: number;
  topMovers: {
    up: Array<{ keyword: string; change: number; position: number }>;
    down: Array<{ keyword: string; change: number; position: number }>;
  };
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const analyticsApi = {
  async getDashboard(domain?: string) {
    const response = await api.get<{ data: DashboardKPIs }>("/analytics/dashboard", {
      params: { domain },
    });
    return response.data.data;
  },

  async getNotifications() {
    const response = await api.get<{ data: NotificationItem[] }>("/analytics/notifications");
    return response.data.data;
  },

  async markNotificationRead(id: string) {
    const response = await api.patch<{ data: NotificationItem }>(`/analytics/notifications/${id}/read`);
    return response.data.data;
  },
};
