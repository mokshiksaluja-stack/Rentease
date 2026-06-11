import { prisma } from "../config/prisma.js";

// Maps userId -> Set of socket instances
const activeConnections = new Map();

// Maps socket.id -> userId
const socketToUserMap = new Map();

let ioInstance = null;

export const socketManager = {
  /**
   * Set the main Socket.IO server instance
   */
  setIo: (io) => {
    ioInstance = io;
  },

  /**
   * Register an authenticated socket connection
   */
  registerUser: async (userId, socket) => {
    socketToUserMap.set(socket.id, userId);

    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, new Set());
    }
    
    const userSockets = activeConnections.get(userId);
    userSockets.add(socket);

    // Make socket join their personal notification room
    socket.join(`user:${userId}`);

    // If this is the user's first active tab/connection, set online status in database
    if (userSockets.size === 1) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true }
        });
        
        // Broadcast user status to all connected clients
        socket.broadcast.emit("user:online", { userId });
        console.log(`🟢 [SocketManager]: User "${userId}" is now online.`);
      } catch (err) {
        console.error(`Failed to update presence state for user "${userId}":`, err.message);
      }
    }
  },

  /**
   * Unregister a disconnected socket
   */
  unregisterUser: async (socket) => {
    const userId = socketToUserMap.get(socket.id);
    if (!userId) return;

    socketToUserMap.delete(socket.id);
    const userSockets = activeConnections.get(userId);

    if (userSockets) {
      userSockets.delete(socket);
      
      // If no active connections remain for this user, set offline status
      if (userSockets.size === 0) {
        activeConnections.delete(userId);
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { 
              isOnline: false,
              lastSeen: new Date()
            }
          });

          // Broadcast offline event to all clients
          if (socket.broadcast) {
            socket.broadcast.emit("user:offline", { userId });
          } else if (ioInstance) {
            ioInstance.emit("user:offline", { userId });
          }
          console.log(`⚫ [SocketManager]: User "${userId}" is now offline.`);
        } catch (err) {
          console.error(`Failed to update offline presence for user "${userId}":`, err.message);
        }
      }
    }
  },

  /**
   * Emit an event to all sockets of a specific user
   */
  emitToUser: (userId, event, payload) => {
    if (ioInstance) {
      ioInstance.to(`user:${userId}`).emit(event, payload);
      return true;
    }
    
    // Fallback if io is not ready
    const userSockets = activeConnections.get(userId);
    if (userSockets) {
      for (const socket of userSockets) {
        socket.emit(event, payload);
      }
      return true;
    }
    return false;
  },

  /**
   * Emit an event to everyone inside a specific conversation room
   */
  emitToConversation: (conversationId, event, payload) => {
    if (ioInstance) {
      ioInstance.to(`conversation:${conversationId}`).emit(event, payload);
      return true;
    }
    return false;
  },

  /**
   * Returns list of currently online user IDs
   */
  getOnlineUsers: () => {
    return Array.from(activeConnections.keys());
  },

  /**
   * Verify if a user is currently online
   */
  isUserOnline: (userId) => {
    return activeConnections.has(userId);
  }
};
