import { prisma } from "../config/prisma.js";

export const messageRepository = {
  /**
   * Create and persist a message record
   */
  create: async (conversationId, senderId, receiverId, message) => {
    return prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        message
      }
    });
  },

  /**
   * Fetch paginated message records for a specific conversation thread
   */
  findManyByConversationId: async (conversationId, skip = 0, take = 20) => {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" }, // Load newest first for infinite scroll
      skip,
      take
    });
  },

  /**
   * Mark all unread messages in a conversation as read for the receiver
   */
  markAsRead: async (conversationId, receiverId) => {
    return prisma.message.updateMany({
      where: {
        conversationId,
        receiverId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  },

  /**
   * Get the total unread messages count for a user across all conversations
   */
  getUnreadCountForUser: async (userId) => {
    return prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
  }
};
