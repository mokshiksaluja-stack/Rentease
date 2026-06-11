import { prisma } from "../config/prisma.js";

export const conversationRepository = {
  /**
   * Create a new conversation thread between a tenant and landlord for a property
   */
  create: async (propertyId, tenantId, landlordId) => {
    return prisma.conversation.create({
      data: {
        propertyId,
        tenantId,
        landlordId
      },
      include: {
        property: true,
        tenant: true,
        landlord: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
  },

  /**
   * Fetch a conversation by its unique ID
   */
  findById: async (id) => {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
        landlord: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
  },

  /**
   * Find an existing conversation thread for a specific property relationship
   */
  findByParticipants: async (propertyId, tenantId, landlordId) => {
    return prisma.conversation.findUnique({
      where: {
        propertyId_tenantId_landlordId: {
          propertyId,
          tenantId,
          landlordId
        }
      },
      include: {
        property: true,
        tenant: true,
        landlord: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
  },

  /**
   * Fetch list of conversations for a user (as tenant or landlord), sorted by last activity
   */
  findUserConversations: async (userId) => {
    return prisma.conversation.findMany({
      where: {
        OR: [
          { tenantId: userId },
          { landlordId: userId }
        ]
      },
      include: {
        property: true,
        tenant: true,
        landlord: true,
        messages: {
          orderBy: { createdAt: "desc" }
          // We include messages to calculate unread counters and load the last message details dynamically
        }
      },
      orderBy: {
        updatedAt: "desc" // Bring recently updated conversations to the top
      }
    });
  },

  /**
   * Update the lastMessageId cache to speed up index retrievals
   */
  updateLastMessage: async (conversationId, messageId) => {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: messageId,
        updatedAt: new Date() // Force updatedAt trigger
      }
    });
  }
};
