import { notificationRepository } from "../repositories/notification.repository.js";
import { firebaseMessaging } from "../config/firebase.js";
import { socketManager } from "./socketManager.service.js";
import { prisma } from "../config/prisma.js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";

export const notificationService = {
  /**
   * Create a system notification, emit it via Socket.IO, and send FCM push notification
   */
  createNotification: async (userId, { type, title, body, metadata = {} }) => {
    // 1. Persist notification to PostgreSQL database
    const notification = await notificationRepository.create(userId, type, title, body, metadata);

    // 2. Fetch target user's deviceToken and presence status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deviceToken: true }
    });

    // 3. Emit real-time in-app notification event via Socket.IO
    socketManager.emitToUser(userId, "notification:receive", {
      ...notification,
      metadata: notification.metadata ? notification.metadata : {}
    });

    // 4. Dispatch Firebase Cloud Message (FCM) if user has registered a device token
    if (user && user.deviceToken) {
      try {
        const payload = {
          token: user.deviceToken,
          notification: {
            title,
            body
          },
          data: {
            type,
            click_action: "FLUTTER_NOTIFICATION_CLICK", // for mobile configurations if any
            metadata: JSON.stringify(metadata)
          }
        };

        // Asynchronous dispatch (non-blocking)
        firebaseMessaging.send(payload)
          .then(messageId => {
            console.log(`📲 [Push Notification]: Successfully sent to user "${userId}". Message ID: ${messageId}`);
          })
          .catch(err => {
            console.error(`💥 [Push Notification Failed]: Failed to send to user "${userId}":`, err.message);
          });
      } catch (err) {
        console.error("Failed to construct FCM payload:", err.message);
      }
    }

    return notification;
  },

  /**
   * Fetch paginated notifications list for a specific user
   */
  getUserNotifications: async (userId, queryParams = {}) => {
    const { page = 1, limit = 10, unreadOnly = false } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const list = await notificationRepository.findManyByUserId(userId, skip, take, unreadOnly === "true" || unreadOnly === true);
    const totalUnread = await notificationRepository.getUnreadCountForUser(userId);

    return {
      notifications: list,
      pagination: {
        page: Number(page),
        limit: Number(limit)
      },
      unreadCount: totalUnread
    };
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (userId, id) => {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      const err = new Error("Notification not found");
      err.statusCode = 404;
      throw err;
    }

    if (notification.userId !== userId) {
      const err = new Error("Forbidden: Unauthorized operation");
      err.statusCode = 403;
      throw err;
    }

    const updated = await notificationRepository.markAsRead(id);
    return updated;
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId) => {
    await notificationRepository.markAllAsRead(userId);
    return { success: true };
  },

  /**
   * Register or update FCM registration device token
   */
  registerDeviceToken: async (userId, deviceToken) => {
    if (!deviceToken) {
      const err = new Error("Device registration token is required");
      err.statusCode = 400;
      throw err;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deviceToken }
    });

    console.log(`📱 [Device Token Registered]: Saved token for user "${userId}".`);
    return { success: true };
  }
};
