import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import type { UserRole } from "../config/constants";

/** Shape of the decoded JWT access token payload */
interface JwtPayload {
  userId: string;
  role: UserRole;
}

/** Extend Express Request with authenticated user */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware: Verify JWT access token from Authorization header.
 * Attaches `req.user` with { id, role } on success.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required. Please log in.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    // Verify user still exists and is not deleted
    const userExists = await User.exists({ _id: decoded.userId });
    if (!userExists) {
      return next(new AppError("User no longer exists.", 401));
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    return next(new AppError("Invalid or expired token.", 401));
  }
};

/**
 * Middleware factory: Restrict access to specific roles.
 * Must be used AFTER authenticate middleware.
 *
 * @example
 * router.get("/admin", authenticate, authorize("admin"), controller)
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }

    next();
  };
};
