export const SUBSCRIPTION_LIMITS = {
  free: {
    keywordLimit: 10,
    websiteLimit: 2,
    dailyAuditLimit: 5,
    crawlPageLimit: 100,
    dailyReportLimit: 3,
  },
  pro: {
    keywordLimit: 500,
    websiteLimit: 20,
    dailyAuditLimit: 50,
    crawlPageLimit: 10_000,
    dailyReportLimit: 50,
  },
  enterprise: {
    keywordLimit: 5_000,
    websiteLimit: 100,
    dailyAuditLimit: 500,
    crawlPageLimit: 100_000,
    dailyReportLimit: 500,
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_LIMITS;

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROJECT_ROLES = ["owner", "editor", "viewer"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const ACCESS_TOKEN_EXPIRY = "15m";
