import { create } from "zustand";
import api from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  subscription: {
    plan: "free" | "pro" | "enterprise";
    keywordLimit: number;
    websiteLimit: number;
    dailyAuditLimit: number;
    crawlPageLimit: number;
    dailyReportLimit: number;
  };
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isLoading: false }),

  setAccessToken: (token) => set({ accessToken: token }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  /**
   * Check if user is authenticated on app mount.
   * Attempts to refresh the access token using the HttpOnly cookie.
   */
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      // Try to refresh token (cookie is sent automatically)
      const { data: refreshData } = await api.post("/auth/refresh");
      const accessToken = refreshData.data.accessToken;

      // Fetch user profile with the new token
      const { data: userData } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      set({
        user: userData.data.user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    set({
      user: data.data.user,
      accessToken: data.data.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (name, email, password) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    set({
      user: data.data.user,
      accessToken: data.data.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
