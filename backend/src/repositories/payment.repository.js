import { prisma } from "../config/prisma.js";

export const paymentRepository = {
  /**
   * Check if a Stripe event has already been processed to prevent duplication
   */
  findWebhookEvent: async (stripeEventId) => {
    return prisma.webhookEvent.findUnique({
      where: { stripeEventId }
    });
  },

  /**
   * Log that a Stripe webhook event was successfully processed
   */
  createWebhookEvent: async (stripeEventId, type) => {
    return prisma.webhookEvent.create({
      data: {
        stripeEventId,
        type,
        processed: true
      }
    });
  }
};
