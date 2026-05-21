import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as notificationsController from "./notifications.controller";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get paginated notifications
router.get("/", notificationsController.getNotifications);

// Get unread count
router.get("/unread-count", notificationsController.getUnreadCount);

// SSE stream for real-time notifications
router.get("/stream", notificationsController.streamNotifications);

// Mark all as read
router.patch("/read-all", notificationsController.markAllAsRead);

// Mark one as read
router.patch("/:id/read", notificationsController.markAsRead);

// Delete notification
router.delete("/:id", notificationsController.deleteNotification);

export default router;
