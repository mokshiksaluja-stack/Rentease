import { chatService } from "../services/chat.service.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const chatController = {
  /**
   * Send a message to start or continue a conversation
   */
  sendMessage: async (req, res, next) => {
    try {
      const senderId = req.user.id;
      const senderRole = req.user.role;
      const { propertyId, receiverId, message } = req.body;

      const data = await chatService.sendMessage(senderId, senderRole, { propertyId, receiverId, message });
      
      new ApiResponse(201, "Message sent successfully", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Fetch conversation threads matching user session
   */
  getUserConversations: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const data = await chatService.getUserConversations(userId);

      new ApiResponse(200, "Conversations retrieved successfully", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieve metadata details for a conversation thread
   */
  getConversationById: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const data = await chatService.getConversationById(userId, id);
      
      new ApiResponse(200, "Conversation thread details loaded", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieve paginated message log history for a conversation
   */
  getConversationMessages: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { conversationId } = req.params;
      const { page, limit } = req.query;

      const data = await chatService.getConversationMessages(userId, conversationId, { page, limit });

      new ApiResponse(200, "Messages history loaded successfully", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Clear unread badges for a conversation
   */
  markConversationAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { conversationId } = req.params;

      const data = await chatService.markConversationAsRead(userId, conversationId);

      new ApiResponse(200, "Conversation marked as read", data).send(res);
    } catch (err) {
      next(err);
    }
  }
};
