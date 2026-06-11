import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Mount authentication globally for all notification routes
router.use(authenticate);

// Get list of user notifications
router.get("/", notificationController.getUserNotifications);

// Mark all as read (Make sure this is mounted BEFORE "/:id/read" to prevent path conflicts)
router.patch("/read-all", notificationController.markAllAsRead);

// Mark single notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Register device token for FCM push alerts
router.post("/device-token", notificationController.registerDeviceToken);

export default router;
