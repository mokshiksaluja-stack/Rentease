import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { socketManager } from "../services/socketManager.service.js";

// Rate limiting state storage: userId -> Array of timestamps
const rateLimits = new Map();

/**
 * Validates JWT connection token and fetches userId
 */
const authenticateSocket = (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.query?.token;

    // Check for token in cookie if not provided directly
    if (!token && socket.handshake.headers.cookie) {
      const cookies = cookie.parse(socket.handshake.headers.cookie);
      token = cookies.accessToken;
    }

    if (!token) {
      return next(new Error("Authentication failed: Access token missing"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Authentication failed: Invalid access token"));
  }
};

/**
 * Check if the user has exceeded message rate limits
 */
const checkRateLimit = (userId) => {
  const limit = 20; // max 20 messages per minute
  const windowMs = 60 * 1000;
  const now = Date.now();

  if (!rateLimits.has(userId)) {
    rateLimits.set(userId, []);
  }

  const timestamps = rateLimits.get(userId);
  
  // Filter out timestamps older than the 1-minute window
  const activeTimestamps = timestamps.filter(ts => now - ts < windowMs);
  activeTimestamps.push(now);
  rateLimits.set(userId, activeTimestamps);

  return activeTimestamps.length <= limit;
};

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  socketManager.setIo(io);

  // Authenticate socket connections
  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    console.log(`🔌 [Socket.IO]: User connected: ${socket.user.name || userId} (Socket ID: ${socket.id})`);

    // Register user in the manager
    await socketManager.registerUser(userId, socket);

    // 1. Join Conversation Room Event
    socket.on("room:join", ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
        console.log(`💬 [Socket.IO]: User "${userId}" joined conversation room: "${conversationId}"`);
      }
    });

    // 2. Leave Conversation Room Event
    socket.on("room:leave", ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
        console.log(`💬 [Socket.IO]: User "${userId}" left conversation room: "${conversationId}"`);
      }
    });

    // 3. Typing Indicators
    socket.on("typing:start", ({ conversationId, receiverId }) => {
      if (conversationId && receiverId) {
        socket.to(`user:${receiverId}`).emit("typing:start", { conversationId, senderId: userId });
      }
    });

    socket.on("typing:stop", ({ conversationId, receiverId }) => {
      if (conversationId && receiverId) {
        socket.to(`user:${receiverId}`).emit("typing:stop", { conversationId, senderId: userId });
      }
    });

    // 4. Read Receipts
    socket.on("message:read", ({ conversationId, readerId }) => {
      if (conversationId && readerId) {
        // Emit read receipt event to other users in the conversation room
        socket.to(`conversation:${conversationId}`).emit("message:read", { conversationId, readerId });
      }
    });

    // 5. Rate-limited Message Sending event fallback
    socket.on("message:send", async (data, callback) => {
      // Check rate-limits
      if (!checkRateLimit(userId)) {
        console.warn(`⚠️ [Socket.IO]: Rate limit exceeded for user "${userId}"`);
        if (callback) {
          callback({ status: "error", code: 429, message: "Rate limit exceeded. Maximum 20 messages per minute." });
        }
        socket.emit("message:error", { message: "Rate limit exceeded. Maximum 20 messages per minute." });
        return;
      }

      // If they passed the rate limiter, we trigger callback approval
      if (callback) {
        callback({ status: "ok" });
      }
    });

    // Disconnect event
    socket.on("disconnect", async () => {
      console.log(`🔌 [Socket.IO]: User disconnected: ${userId} (Socket ID: ${socket.id})`);
      await socketManager.unregisterUser(socket);
    });
  });

  return io;
};
