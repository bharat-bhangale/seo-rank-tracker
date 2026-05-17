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

  const websiteCount = await Website.countDocuments({ userId });

  return {
    plan,
    usage: {
      websites: { used: websiteCount, limit: limits.websiteLimit },
      keywords: { used: 0, limit: limits.keywordLimit }, // Will be wired in Phase 4
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

  await Website.deleteMany({ userId });
  await Project.deleteMany({ ownerId: userId });

  // Remove from projects where they are a member
  await Project.updateMany(
    { "members.userId": userId },
    { $pull: { members: { userId } } }
  );

  await User.findByIdAndDelete(userId);
};
