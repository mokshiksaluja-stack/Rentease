import { prisma } from "../config/prisma.js";
import { conversationRepository } from "../repositories/conversation.repository.js";
import { messageRepository } from "../repositories/message.repository.js";
import { notificationService } from "./notification.service.js";
import { socketManager } from "./socketManager.service.js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";
import { MessageDTO, ConversationDTO } from "../dtos/message.dto.js";

export const chatService = {
  /**
   * Send a message and manage conversation lifecycle policies
   */
  sendMessage: async (senderId, senderRole, { propertyId, receiverId, message }) => {
    // 1. Text sanitization and validations
    const trimmed = message ? message.trim() : "";
    if (!trimmed) {
      const err = new Error("Message content cannot be empty");
      err.statusCode = 400;
      throw err;
    }
    if (trimmed.length > 2000) {
      const err = new Error("Message content exceeds the 2000 character limit");
      err.statusCode = 400;
      throw err;
    }

    // Strip HTML/script tags to prevent XSS injection
    const sanitizedMessage = trimmed.replace(/<[^>]*>/g, "");

    // 2. Prevent self-messaging
    if (senderId === receiverId) {
      const err = new Error("Conflict: Users cannot message themselves");
      err.statusCode = 400;
      throw err;
    }

    // 3. Retrieve and validate property listing status
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    if (!property) {
      const err = new Error("Requested property listing does not exist");
      err.statusCode = 404;
      throw err;
    }
    if (!property.isAvailable) {
      const err = new Error("Property listing is currently marked as unavailable/archived");
      err.statusCode = 400;
      throw err;
    }

    // 4. Role authorization rules check
    const isSenderTenant = senderRole === "TENANT";
    const isSenderLandlord = senderRole === "LANDLORD";

    let tenantId, landlordId;

    if (isSenderTenant) {
      // Tenant initiates to Landlord
      if (receiverId !== property.landlordId) {
        const err = new Error("Forbidden: Tenants can only message the landlord of the property");
        err.statusCode = 403;
        throw err;
      }
      tenantId = senderId;
      landlordId = receiverId;
    } else if (isSenderLandlord) {
      // Landlord initiates to Tenant
      if (senderId !== property.landlordId) {
        const err = new Error("Forbidden: You do not own this property listing");
        err.statusCode = 403;
        throw err;
      }
      tenantId = receiverId;
      landlordId = senderId;

      // Verify landlord permission rule: must have bookings or existing conversation
      const conversationExists = await conversationRepository.findByParticipants(propertyId, tenantId, landlordId);
      if (!conversationExists) {
        // If thread doesn't exist, check if tenant has an active/past booking on this property
        const activeBooking = await prisma.booking.findFirst({
          where: {
            propertyId,
            tenantId
          }
        });
        if (!activeBooking) {
          const err = new Error("Forbidden: Landlords can only initiate messages to tenants who have booked this property");
          err.statusCode = 403;
          throw err;
        }
      }
    } else {
      // Admins bypass normal rules
      tenantId = senderRole === "TENANT" ? senderId : receiverId;
      landlordId = senderRole === "LANDLORD" ? senderId : receiverId;
    }

    // Fetch sender profile details to build notification string
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true }
    });

    // 5. Query or auto-create conversation record
    let conversation = await conversationRepository.findByParticipants(propertyId, tenantId, landlordId);
    if (!conversation) {
      conversation = await conversationRepository.create(propertyId, tenantId, landlordId);
      console.log(`💬 [Conversation Created]: Auto-created conversation "${conversation.id}" for property "${property.title}".`);
    }

    // 6. Write message record
    const messageRecord = await messageRepository.create(conversation.id, senderId, receiverId, sanitizedMessage);

    // 7. Update conversation last message timestamp caches
    await conversationRepository.updateLastMessage(conversation.id, messageRecord.id);

    const messageDTO = MessageDTO.fromEntity(messageRecord);

    // 8. Push message event via Socket.IO
    socketManager.emitToConversation(conversation.id, "message:receive", messageDTO);
    
    // Also emit to the receiver's private room to alert of incoming message if they are outside conversation room
    socketManager.emitToUser(receiverId, "message:receive", messageDTO);

    // 9. Write message notification (asynchronously to avoid thread blocking)
    notificationService.createNotification(receiverId, {
      type: NOTIFICATION_TYPES.MESSAGE_RECEIVED,
      title: `New message from ${sender?.name || "User"}`,
      body: sanitizedMessage.length > 70 ? `${sanitizedMessage.substring(0, 70)}...` : sanitizedMessage,
      metadata: {
        conversationId: conversation.id,
        propertyId: property.id
      }
    }).catch(err => {
      console.error("Failed to generate message notification:", err.message);
    });

    return messageDTO;
  },

  /**
   * Fetch active conversation threads list for current user
   */
  getUserConversations: async (userId) => {
    const list = await conversationRepository.findUserConversations(userId);
    return ConversationDTO.fromEntities(list, userId);
  },

  /**
   * Get detail metrics for a single conversation
   */
  getConversationById: async (userId, id) => {
    const conv = await conversationRepository.findById(id);
    if (!conv) {
      const err = new Error("Conversation not found");
      err.statusCode = 404;
      throw err;
    }

    if (conv.tenantId !== userId && conv.landlordId !== userId) {
      const err = new Error("Forbidden: You are not authorized to access this conversation thread");
      err.statusCode = 403;
      throw err;
    }

    return ConversationDTO.fromEntity(conv, userId);
  },

  /**
   * Load messages history for a conversation thread
   */
  getConversationMessages: async (userId, conversationId, queryParams = {}) => {
    const conv = await conversationRepository.findById(conversationId);
    if (!conv) {
      const err = new Error("Conversation thread not found");
      err.statusCode = 404;
      throw err;
    }

    if (conv.tenantId !== userId && conv.landlordId !== userId) {
      const err = new Error("Forbidden: You are not authorized to view messages in this conversation");
      err.statusCode = 403;
      throw err;
    }

    const { page = 1, limit = 20 } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const list = await messageRepository.findManyByConversationId(conversationId, skip, take);
    return MessageDTO.fromEntities(list);
  },

  /**
   * Mark all unread messages in a conversation as read
   */
  markConversationAsRead: async (userId, conversationId) => {
    const conv = await conversationRepository.findById(conversationId);
    if (!conv) {
      const err = new Error("Conversation thread not found");
      err.statusCode = 404;
      throw err;
    }

    if (conv.tenantId !== userId && conv.landlordId !== userId) {
      const err = new Error("Forbidden: You cannot mark this conversation as read");
      err.statusCode = 403;
      throw err;
    }

    await messageRepository.markAsRead(conversationId, userId);

    // Emit read receipt event to conversation room
    socketManager.emitToConversation(conversationId, "message:read", {
      conversationId,
      readerId: userId
    });

    return { success: true };
  }
};
