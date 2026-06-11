import { stripeService } from "../services/stripe.service.js";
import { paymentService } from "../services/payment.service.js";
import { paymentAnalyticsService } from "../services/paymentAnalytics.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { isSimulationMode } from "../config/stripe.js";

export const paymentController = {
  /**
   * Create a Stripe PaymentIntent for a confirmed booking
   */
  createPaymentIntent: async (req, res, next) => {
    try {
      const tenantId = req.user.id;
      const { bookingId } = req.body;

      const data = await stripeService.createPaymentIntent(bookingId, tenantId);
      
      new ApiResponse(201, "Payment intent created successfully", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Confirm simulated payment (simulation mode fallback to mimic webhooks)
   */
  confirmPaymentSimulated: async (req, res, next) => {
    try {
      const { paymentIntentId } = req.body;

      // In production mode, this endpoint is blocked
      if (!isSimulationMode && process.env.NODE_ENV === "production") {
        const err = new Error("Forbidden: Simulated payment confirm is disabled in production environments");
        err.statusCode = 403;
        throw err;
      }

      // Mimic Stripe Webhook confirmation flow
      const data = await paymentService.confirmPayment(paymentIntentId);
      
      new ApiResponse(200, "Payment confirmed successfully (SIMULATED)", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get user transaction payment history list
   */
  getPaymentHistory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const { page, limit } = req.query;

      const data = await paymentService.getPaymentHistory(userId, role, { page, limit });

      new ApiResponse(200, "Payment history loaded successfully", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get individual payment invoice details
   */
  getPaymentById: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const { id } = req.params;

      const data = await paymentService.getPaymentById(userId, role, id);

      new ApiResponse(200, "Payment details retrieved successfully", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get dashboard financial analytics overview
   */
  getFinancialAnalytics: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      const summary = await paymentAnalyticsService.getFinancialSummary(userId, role);
      const monthlyTrends = await paymentAnalyticsService.getRevenueByMonth(userId, role);

      const data = {
        summary,
        monthlyTrends
      };

      new ApiResponse(200, "Financial analytics loaded", data).send(res);
    } catch (err) {
      next(err);
    }
  }
};
