import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../../utils/response";
import * as notificationsService from "./notifications.service";

/**
 * GET /api/v1/notifications
 * Get paginated notifications for the authenticated user.
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { notifications, total, unreadCount, page, limit } =
    await notificationsService.getNotifications(req.user!.id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      unreadOnly: req.query.unreadOnly === "true",
    });
  sendPaginated(res, notifications, total, page, limit);
});

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count.
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationsService.getUnreadCount(req.user!.id);
  sendSuccess(res, { unreadCount: count });
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read.
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAsRead(req.params.id as string, req.user!.id);
  sendSuccess(res, null, 200, "Notification marked as read");
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read.
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAllAsRead(req.user!.id);
  sendSuccess(res, null, 200, "All notifications marked as read");
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification.
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.deleteNotification(req.params.id as string, req.user!.id);
  sendSuccess(res, null, 200, "Notification deleted");
});

/**
 * GET /api/v1/notifications/stream
 * SSE endpoint for real-time notification delivery.
 */
export const streamNotifications = asyncHandler(async (req: Request, res: Response) => {
  notificationsService.registerSSEConnection(req.user!.id, res);
});
