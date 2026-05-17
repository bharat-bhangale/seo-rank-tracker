import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User, type IUser } from "../../models/User.model";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
import { REFRESH_TOKEN_EXPIRY_DAYS } from "../../config/constants";
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "./auth.validation";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

// ──────────────────────────────────────────────
// Token Helpers
// ──────────────────────────────────────────────

/**
 * Generate a JWT access token (short-lived, 15 min).
 */
const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
  } as jwt.SignOptions);
};

/**
 * Generate a cryptographically secure refresh token.
 * Stored as a hash in the database for security.
 */
const generateRefreshToken = (): { raw: string; hashed: string } => {
  const raw = crypto.randomBytes(40).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
};

// ──────────────────────────────────────────────
// Auth Service Functions
// ──────────────────────────────────────────────

/**
 * Register a new user account.
 * @throws AppError 409 if email already exists.
 */
export const register = async (input: RegisterInput): Promise<AuthResult> => {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const { raw, hashed } = generateRefreshToken();

  // Store hashed refresh token
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );
  user.refreshTokens = [{ token: hashed, createdAt: new Date(), expiresAt }];
  await user.save();

  return { user, accessToken, refreshToken: raw };
};

/**
 * Authenticate a user with email + password.
 * @throws AppError 401 on invalid credentials.
 */
export const login = async (input: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({ email: input.email }).select(
    "+password +refreshTokens"
  );

  if (!user || !(await user.comparePassword(input.password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { raw, hashed } = generateRefreshToken();

  // Clean up expired tokens, then add new one
  const now = new Date();
  user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > now);

  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );
  user.refreshTokens.push({ token: hashed, createdAt: now, expiresAt });

  // Limit stored tokens to 5 (prevents token array bloat)
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();

  return { user, accessToken, refreshToken: raw };
};

/**
 * Rotate refresh token: invalidate the old one, issue new pair.
 * Implements one-time-use token rotation for replay protection.
 *
 * @throws AppError 401 if token is invalid or already used.
 */
export const refreshAccessToken = async (
  oldRawToken: string
): Promise<TokenPair> => {
  const oldHashed = crypto
    .createHash("sha256")
    .update(oldRawToken)
    .digest("hex");

  const user = await User.findOne({
    "refreshTokens.token": oldHashed,
  }).select("+refreshTokens");

  if (!user) {
    throw new AppError("Invalid refresh token.", 401);
  }

  // Find and remove the used token (one-time use)
  const tokenIndex = user.refreshTokens.findIndex(
    (t) => t.token === oldHashed
  );

  if (tokenIndex === -1 || user.refreshTokens[tokenIndex].expiresAt < new Date()) {
    // If token is expired or not found, invalidate ALL tokens (possible replay attack)
    user.refreshTokens = [];
    await user.save();
    throw new AppError("Refresh token expired or invalid. Please log in again.", 401);
  }

  // Remove the used token
  user.refreshTokens.splice(tokenIndex, 1);

  // Generate new token pair
  const accessToken = generateAccessToken(user.id, user.role);
  const { raw, hashed } = generateRefreshToken();

  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );
  user.refreshTokens.push({ token: hashed, createdAt: new Date(), expiresAt });

  await user.save();

  return { accessToken, refreshToken: raw };
};

/**
 * Logout: Remove a specific refresh token from the user's token array.
 */
export const logout = async (rawRefreshToken: string): Promise<void> => {
  const hashed = crypto
    .createHash("sha256")
    .update(rawRefreshToken)
    .digest("hex");

  await User.updateOne(
    { "refreshTokens.token": hashed },
    { $pull: { refreshTokens: { token: hashed } } }
  );
};

/**
 * Logout from all devices: Clear all refresh tokens.
 */
export const logoutAll = async (userId: string): Promise<void> => {
  await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
};

/**
 * Initiate password reset: Generate a reset token and return it.
 * In production, this token would be sent via email.
 *
 * @throws AppError 404 if user not found.
 */
export const forgotPassword = async (email: string): Promise<string> => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether the email exists — but still return gracefully
    throw new AppError(
      "If an account with that email exists, a reset link has been sent.",
      200
    );
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  return resetToken;
};

/**
 * Reset password using a valid reset token.
 *
 * @throws AppError 400 if token is invalid or expired.
 */
export const resetPassword = async (
  resetToken: string,
  input: ResetPasswordInput
): Promise<void> => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token.", 400);
  }

  user.password = input.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions on password reset
  await user.save();
};

/**
 * Change password for an authenticated user.
 *
 * @throws AppError 401 if current password is wrong.
 */
export const changePassword = async (
  userId: string,
  input: ChangePasswordInput
): Promise<void> => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const isMatch = await user.comparePassword(input.currentPassword);
  if (!isMatch) {
    throw new AppError("Current password is incorrect.", 401);
  }

  user.password = input.newPassword;
  user.refreshTokens = []; // Invalidate all sessions on password change
  await user.save();
};

/**
 * Get user profile by ID.
 */
export const getUserById = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }
  return user;
};
