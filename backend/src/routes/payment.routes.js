import { Router } from "express";
import { paymentController } from "../controllers/payment.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// Mount authentication globally for all routes
router.use(authenticate);

// Create PaymentIntent (Tenants only)
router.post("/create-intent", authorize("TENANT"), paymentController.createPaymentIntent);

// Fallback confirmation handler for simulation mode
router.post("/confirm", paymentController.confirmPaymentSimulated);

// Fetch transaction history
router.get("/history", paymentController.getPaymentHistory);

// Fetch financial dashboard summary analytics
router.get("/analytics", paymentController.getFinancialAnalytics);

// Fetch payment detail metrics
router.get("/:id", paymentController.getPaymentById);

export default router;
