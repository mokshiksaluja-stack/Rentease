import { prisma } from "../config/prisma.js";

export const notificationRepository = {
  /**
   * Insert a new notification record into the database
   */
  create: async (userId, type, title, body, metadata = null) => {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      }
    });
  },

  /**
   * Find a notification by its unique ID
   */
  findById: async (id) => {
    return prisma.notification.findUnique({
      where: { id }
    });
  },

  /**
   * Find paginated notifications matching user ID and optional filter unread status
   */
  findManyByUserId: async (userId, skip = 0, take = 10, unreadOnly = false) => {
    const whereClause = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    return prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take
    });
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (id) => {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  },

  /**
   * Mark all notifications of a specific user as read
   */
  markAllAsRead: async (userId) => {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });
  },

  /**
   * Get unread notifications count for a user
   */
  getUnreadCountForUser: async (userId) => {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }
};
