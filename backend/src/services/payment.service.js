import { prisma } from "../config/prisma.js";
import { receiptService } from "./receipt.service.js";
import { notificationService } from "./notification.service.js";
import { bookingTimelineRepository } from "../repositories/bookingTimeline.repository.js";
import { PAYMENT_STATUS } from "../constants/paymentStatus.js";
import { isValidPaymentTransition } from "../constants/paymentTransitions.js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";
import { calculateBookingCost } from "./stripe.service.js";
import { PaymentDTO } from "../dtos/payment.dto.js";

export const paymentService = {
  /**
   * Confirm a successful payment (normally invoked via Stripe webhook)
   */
  confirmPayment: async (paymentIntentId) => {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        booking: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    });

    if (!payment) {
      console.error(`💥 [PaymentService]: Confirmation failed. PaymentIntent "${paymentIntentId}" not found in database.`);
      return null;
    }

    // Validate state transition
    if (!isValidPaymentTransition(payment.status, PAYMENT_STATUS.SUCCEEDED)) {
      if (payment.status === PAYMENT_STATUS.SUCCEEDED) {
        console.log(`ℹ️  [PaymentService]: PaymentIntent "${paymentIntentId}" is already marked as SUCCEEDED.`);
        return payment;
      }
      throw new Error(`Invalid state transition: Cannot change status from ${payment.status} to SUCCEEDED`);
    }

    // 1. Update Payment record to SUCCEEDED
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.SUCCEEDED,
        processedAt: new Date()
      }
    });

    // 2. Update booking paymentStatus to PAID
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: "PAID"
      }
    });

    // 3. Register booking timeline event
    await bookingTimelineRepository.create(payment.bookingId, "PAYMENT_SUCCEEDED", "Rent payment received and verified successfully via Stripe.");

    // 4. Generate PDF invoice receipt and upload to Cloudinary (asynchronous)
    const costBreakdown = calculateBookingCost(
      payment.booking.property.rent,
      payment.booking.checkIn,
      payment.booking.checkOut
    );

    receiptService.generateAndUploadReceipt(updatedPayment, payment.booking, costBreakdown)
      .then(async (url) => {
        // Save receipt download link in database
        await prisma.payment.update({
          where: { id: payment.id },
          data: { receiptUrl: url }
        });
        console.log(`📄 [PaymentService]: PDF invoice receipt generated: ${url}`);
      })
      .catch((err) => {
        console.error("💥 [PaymentService]: Receipt PDF generation failed:", err.message);
      });

    // 5. Send notifications to Tenant (success) and Landlord (funds received)
    await notificationService.createNotification(payment.tenantId, {
      type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      title: "Rent Payment Succeeded",
      body: `Your rent payment of ₹${payment.amount} for "${payment.booking.property.title}" has succeeded.`,
      metadata: {
        bookingId: payment.bookingId,
        paymentId: payment.id
      }
    });

    await notificationService.createNotification(payment.landlordId, {
      type: NOTIFICATION_TYPES.PAYMENT_SUCCESS, // Reuses type category for formatting
      title: "Rent Payment Received",
      body: `You received a rent payment of ₹${payment.amount} from ${payment.booking.tenant.name} for "${payment.booking.property.title}".`,
      metadata: {
        bookingId: payment.bookingId,
        paymentId: payment.id
      }
    });

    return updatedPayment;
  },

  /**
   * Record a payment failure
   */
  failPayment: async (paymentIntentId, reason = "Card declined") => {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { booking: { select: { bookingReference: true } } }
    });

    if (!payment) return null;

    if (!isValidPaymentTransition(payment.status, PAYMENT_STATUS.FAILED)) {
      return payment;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.FAILED,
        failureReason: reason,
        processedAt: new Date()
      }
    });

    // Register booking timeline failure log
    await bookingTimelineRepository.create(payment.bookingId, "PAYMENT_FAILED", `Rent payment failed. Reason: ${reason}`);

    // Notify Tenant about the decline
    await notificationService.createNotification(payment.tenantId, {
      type: NOTIFICATION_TYPES.PAYMENT_FAILED,
      title: "Rent Payment Failed",
      body: `Your rent payment of ₹${payment.amount} for booking "${payment.booking.bookingReference}" has failed. Reason: ${reason}.`,
      metadata: {
        bookingId: payment.bookingId,
        paymentId: payment.id
      }
    });

    return updatedPayment;
  },

  /**
   * Record a refund
   */
  refundPayment: async (paymentIntentId) => {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        booking: {
          select: {
            bookingReference: true,
            property: { select: { title: true } }
          }
        }
      }
    });

    if (!payment) return null;

    if (!isValidPaymentTransition(payment.status, PAYMENT_STATUS.REFUNDED)) {
      return payment;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.REFUNDED,
        refundedAt: new Date()
      }
    });

    // Update booking paymentStatus
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: "REFUNDED",
        status: "CANCELLED"
      }
    });

    // Register timeline refund log
    await bookingTimelineRepository.create(payment.bookingId, "PAYMENT_REFUNDED", "Rent payment charge has been fully refunded back to tenant card.");

    // Notify Tenant
    await notificationService.createNotification(payment.tenantId, {
      type: NOTIFICATION_TYPES.PAYMENT_REFUNDED,
      title: "Rent Charge Refunded",
      body: `Your payment of ₹${payment.amount} for "${payment.booking.property.title}" has been refunded.`,
      metadata: {
        bookingId: payment.bookingId,
        paymentId: payment.id
      }
    });

    return updatedPayment;
  },

  /**
   * Fetch payment transaction history list matching filters
   */
  getPaymentHistory: async (userId, role, queryParams = {}) => {
    const { page = 1, limit = 10 } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (role === "LANDLORD") {
      where.landlordId = userId;
    } else if (role === "TENANT") {
      where.tenantId = userId;
    }

    const list = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        booking: {
          select: {
            bookingReference: true,
            property: { select: { title: true } }
          }
        }
      }
    });

    const count = await prisma.payment.count({ where });

    return {
      payments: PaymentDTO.fromEntities(list),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    };
  },

  /**
   * Fetch individual payment details
   */
  getPaymentById: async (userId, role, id) => {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    });

    if (!payment) {
      const err = new Error("Payment record not found");
      err.statusCode = 404;
      throw err;
    }

    // Role authentication
    if (role !== "ADMIN" && payment.tenantId !== userId && payment.landlordId !== userId) {
      const err = new Error("Forbidden: You do not have permission to view this transaction statement");
      err.statusCode = 403;
      throw err;
    }

    return PaymentDTO.fromEntity(payment);
  }
};
