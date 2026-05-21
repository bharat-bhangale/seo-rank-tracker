import { Notification, type INotification } from "../../models/Notification.model";
import { AppError } from "../../utils/AppError";
import type { Response } from "express";

/**
 * Create a new notification for a user.
 * Called internally by other services (rank alerts, audit completion, etc.).
 */
export const createNotification = async (
  userId: string,
  data: {
    type: INotification["type"];
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }
): Promise<INotification> => {
  const notification = await Notification.create({
    userId,
    ...data,
  });

  // If there's an active SSE connection, push the notification
  const connection = sseConnections.get(userId);
  if (connection) {
    connection.write(`data: ${JSON.stringify(notification)}\n\n`);
  }

  return notification;
};

/**
 * Get paginated notifications for a user.
 */
export const getNotifications = async (
  userId: string,
  query: { page?: number; limit?: number; unreadOnly?: boolean }
): Promise<{
  notifications: INotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}> => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId };
  if (query.unreadOnly) filter.read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, read: false }),
  ]);

  return {
    notifications: notifications as unknown as INotification[],
    total,
    unreadCount,
    page,
    limit,
  };
};

/**
 * Mark a specific notification as read.
 */
export const markAsRead = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const result = await Notification.updateOne(
    { _id: notificationId, userId },
    { $set: { read: true } }
  );

  if (result.matchedCount === 0) {
    throw new AppError("Notification not found.", 404);
  }
};

/**
 * Mark all notifications as read for a user.
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  await Notification.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );
};

/**
 * Delete a notification.
 */
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const result = await Notification.deleteOne({
    _id: notificationId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError("Notification not found.", 404);
  }
};

/**
 * Get unread notification count for a user.
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ userId, read: false });
};

// ── SSE (Server-Sent Events) Connection Management ──────
const sseConnections = new Map<string, Response>();

/**
 * Register an SSE connection for real-time notification delivery.
 */
export const registerSSEConnection = (userId: string, res: Response): void => {
  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  // Store connection
  sseConnections.set(userId, res);

  // Clean up on disconnect
  res.on("close", () => {
    sseConnections.delete(userId);
  });
};

/**
 * Send a heartbeat to keep SSE connections alive.
 * Should be called periodically (e.g., every 30s).
 */
export const sendSSEHeartbeat = (): void => {
  const heartbeat = `data: ${JSON.stringify({ type: "heartbeat" })}\n\n`;
  sseConnections.forEach((res) => {
    res.write(heartbeat);
  });
};

// Heartbeat interval: every 30 seconds
setInterval(sendSSEHeartbeat, 30_000);
