import { notificationService } from "../services/notification.service.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const notificationController = {
  /**
   * Get user notifications with paginations and unread filters
   */
  getUserNotifications: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page, limit, unreadOnly } = req.query;

      const data = await notificationService.getUserNotifications(userId, { page, limit, unreadOnly });

      new ApiResponse(200, "Notifications retrieved successfully", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const data = await notificationService.markAsRead(userId, id);

      new ApiResponse(200, "Notification marked as read", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const data = await notificationService.markAllAsRead(userId);

      new ApiResponse(200, "All notifications marked as read", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Register device FCM token
   */
  registerDeviceToken: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      const data = await notificationService.registerDeviceToken(userId, token);

      new ApiResponse(200, "Device token registered successfully", data).send(res);
    } catch (err) {
      next(err);
    }
  }
};
