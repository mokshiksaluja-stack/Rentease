import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

class SocketService {
  constructor() {
    this.socket = null;
  }

  /**
   * Establish connection to Socket.IO backend passing user's access token
   */
  connect(token) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: false
    });

    this.socket.connect();

    this.socket.on("connect", () => {
      console.log("🔌 [SocketService]: Connected successfully. ID:", this.socket.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("💥 [SocketService]: Connection error:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("🔌 [SocketService]: Disconnected. Reason:", reason);
    });

    return this.socket;
  }

  /**
   * Terminate active socket connection
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("🔌 [SocketService]: Disconnected manually.");
    }
  }

  /**
   * Subscribe to a socket event
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.warn(`[SocketService]: Cannot register listener for event "${event}". Socket not initialized.`);
    }
  }

  /**
   * Unsubscribe from a socket event
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Dispatch/emit an event to the backend server
   */
  emit(event, data, callback) {
    if (this.socket) {
      this.socket.emit(event, data, callback);
    } else {
      console.error(`[SocketService]: Cannot emit event "${event}". Socket not connected.`);
    }
  }

  /**
   * Get active socket client instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Join a room
   */
  joinRoom(conversationId) {
    this.emit("room:join", { conversationId });
  }

  /**
   * Leave a room
   */
  leaveRoom(conversationId) {
    this.emit("room:leave", { conversationId });
  }
}

export const socketService = new SocketService();
