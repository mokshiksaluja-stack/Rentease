import dotenv from "dotenv";

// Load environment variables from .env file BEFORE importing the app
dotenv.config();

import { app } from "./app.js";
import { initSocket } from "./config/socket.js";

const PORT = process.env.PORT || 5000;

// Start the HTTP server listener
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 RentEase Backend Running on Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`=========================================`);
});

// Initialize Socket.io Server passing the HTTP server reference
initSocket(server);

// Capture uncaught code exceptions (e.g. referencing an undefined variable)
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down server...", err.name, err.message);
  process.exit(1); // Exit process immediately to prevent corrupted memory states
});

// Capture unhandled asynchronous promise rejections (e.g. database connection drops)
process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED REJECTION! Shutting down server...", err);
  server.close(() => {
    process.exit(1); // Close active HTTP requests, then exit the application
  });
});
