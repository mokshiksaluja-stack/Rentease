import { Router } from "express";
import { chatController } from "../controllers/chat.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Mount authentication globally for all chat routes
router.use(authenticate);

// Send message
router.post("/message", chatController.sendMessage);

// Retrieve conversations list
router.get("/conversations", chatController.getUserConversations);

// Retrieve conversation details
router.get("/conversations/:id", chatController.getConversationById);

// Retrieve conversation messages
router.get("/messages/:conversationId", chatController.getConversationMessages);

// Mark conversation as read
router.patch("/read/:conversationId", chatController.markConversationAsRead);

export default router;
