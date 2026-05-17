import { User, type IUser } from "../../models/User.model";
import { AppError } from "../../utils/AppError";
import { SUBSCRIPTION_LIMITS, type SubscriptionPlan } from "../../config/constants";
import type { UpdateProfileInput } from "./user.validation";

/**
 * Get full user profile by ID.
 */
export const getProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }
  return user;
};

/**
 * Update user profile fields (name, avatar, timezone, locale).
 */
export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: input },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return user;
};

/**
 * Get current usage stats for the user.
 * Returns counts of keywords, websites, etc. vs. subscription limits.
 */
export const getUsageStats = async (
  userId: string
): Promise<{
  plan: SubscriptionPlan;
  usage: Record<string, { used: number; limit: number }>;
}> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const plan = user.subscription.plan as SubscriptionPlan;
  const limits = SUBSCRIPTION_LIMITS[plan];

  // Import models dynamically to avoid circular dependencies
  const { Website } = await import("../../models/Website.model");
  const { Keyword } = await import("../../models/Keyword.model");

  const [websiteCount, keywordCount] = await Promise.all([
    Website.countDocuments({ userId }),
    Keyword.countDocuments({ userId, status: "active" }),
  ]);

  return {
    plan,
    usage: {
      websites: { used: websiteCount, limit: limits.websiteLimit },
      keywords: { used: keywordCount, limit: limits.keywordLimit },
      dailyAudits: { used: 0, limit: limits.dailyAuditLimit },
      dailyReports: { used: 0, limit: limits.dailyReportLimit },
    },
  };
};

/**
 * Delete user account and all associated data.
 */
export const deleteAccount = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  // Delete associated data
  const { Website } = await import("../../models/Website.model");
  const { Project } = await import("../../models/Project.model");
  const { Keyword } = await import("../../models/Keyword.model");
  const { RankCheck } = await import("../../models/RankCheck.model");
  const { RankAlert } = await import("../../models/RankAlert.model");
  const { GscProperty } = await import("../../models/GscProperty.model");
  const { GscPerformance } = await import("../../models/GscPerformance.model");

  await Promise.all([
    Website.deleteMany({ userId }),
    Project.deleteMany({ ownerId: userId }),
    Keyword.deleteMany({ userId }),
    RankCheck.deleteMany({ userId }),
    RankAlert.deleteMany({ userId }),
    GscProperty.deleteMany({ userId }),
    GscPerformance.deleteMany({ userId }),
  ]);

  // Remove from projects where they are a member
  await Project.updateMany(
    { "members.userId": userId },
    { $pull: { members: { userId } } }
  );

  await User.findByIdAndDelete(userId);
};
