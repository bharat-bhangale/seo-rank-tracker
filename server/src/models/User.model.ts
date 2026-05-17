import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { SUBSCRIPTION_LIMITS, type SubscriptionPlan, type UserRole } from "../config/constants";

/** Subdocument: Refresh token entry */
interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

/** Subdocument: Subscription details */
interface ISubscription {
  plan: SubscriptionPlan;
  keywordLimit: number;
  websiteLimit: number;
  dailyAuditLimit: number;
  crawlPageLimit: number;
  dailyReportLimit: number;
}

/** User document interface */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  subscription: ISubscription;
  refreshTokens: IRefreshToken[];
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  avatar?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getSubscriptionLimits(): ISubscription;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const subscriptionSchema = new Schema<ISubscription>(
  {
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    keywordLimit: { type: Number, default: SUBSCRIPTION_LIMITS.free.keywordLimit },
    websiteLimit: { type: Number, default: SUBSCRIPTION_LIMITS.free.websiteLimit },
    dailyAuditLimit: { type: Number, default: SUBSCRIPTION_LIMITS.free.dailyAuditLimit },
    crawlPageLimit: { type: Number, default: SUBSCRIPTION_LIMITS.free.crawlPageLimit },
    dailyReportLimit: { type: Number, default: SUBSCRIPTION_LIMITS.free.dailyReportLimit },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({
        plan: "free",
        ...SUBSCRIPTION_LIMITS.free,
      }),
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      select: false, // Never return tokens in queries by default
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    avatar: String,
    googleId: { type: String, sparse: true },
  },
  {
    timestamps: true,
    toJSON: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for fast email lookups
userSchema.index({ email: 1 });

/**
 * Pre-save hook: Hash password before saving.
 * Only runs when the password field is modified.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method: Compare a candidate password with the stored hash.
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method: Get current subscription limits based on plan.
 */
userSchema.methods.getSubscriptionLimits = function (): ISubscription {
  const plan = this.subscription.plan as SubscriptionPlan;
  return {
    plan,
    ...SUBSCRIPTION_LIMITS[plan],
  };
};

export const User = mongoose.model<IUser>("User", userSchema);
