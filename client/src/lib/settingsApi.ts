import api from "./api";

export const settingsApi = {
  getProfile: () => api.get("/users/me"),

  updateProfile: (data: { name?: string; email?: string; avatar?: string }) =>
    api.patch("/users/me", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),

  getSubscription: () => api.get("/users/me/subscription"),

  deleteAccount: () => api.delete("/users/me"),
};
