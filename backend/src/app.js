import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import propertyRoutes from "./routes/property.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { stripeWebhookHandler } from "./webhooks/stripe.webhook.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

// 1. Apply Global Security Middlewares
app.use(helmet()); // Sets headers to secure HTTP responses against common exploits

// Configure CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    credentials: true, // Allow cookies to be sent along with HTTP requests
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] // Restrict allowed HTTP methods
  })
);

// 2. Apply Rate Limiting (Abuse Prevention)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === "production" ? 100 : 10000, // Limit each IP (raised to 10000 in development to prevent lockout)
  standardHeaders: true, // Return standard rate limit info headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: {
    status: "error",
    statusCode: 429,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});
app.use("/api", limiter); // Apply the rate limiter to all API endpoints

// 3. Webhook Mount (Must receive raw buffer for Stripe signature verification)
app.post("/api/v1/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

// 4. Body Parsers (Parse incoming JSON and form data)
app.use(express.json({ limit: "16kb" })); // Allow JSON bodies up to 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Parse URL-encoded data
app.use(cookieParser()); // Parses incoming cookies (crucial to read secure refresh token cookies)

// 5. API Endpoints
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/properties", propertyRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/admin", adminRoutes);

// 5. Fallback Route (Handle undefined endpoint requests - 404)
app.use("*", (req, res, next) => {
  const err = new Error(`Cannot find requested route ${req.originalUrl} on this server`);
  err.statusCode = 404;
  next(err); // Forward the 404 error to the error middleware
});

// 6. Global Error Interceptor (MUST be registered last)
app.use(errorMiddleware);

export { app };
