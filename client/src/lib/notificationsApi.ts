import api from "./api";

export interface Notification {
  _id: string;
  type: "rank_change" | "audit_complete" | "report_ready" | "backlink_alert" | "system";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get("/notifications", { params }),

  getUnreadCount: () => api.get("/notifications/unread-count"),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch("/notifications/read-all"),

  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
};
