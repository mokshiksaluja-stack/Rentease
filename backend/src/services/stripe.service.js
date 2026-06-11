import { stripe, isSimulationMode } from "../config/stripe.js";
import { prisma } from "../config/prisma.js";

/**
 * Calculates rental fees on the backend to prevent pricing spoofing from client agents.
 */
export const calculateBookingCost = (propertyRent, checkIn, checkOut) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  const dailyRate = Number(propertyRent) / 30;
  const subtotal = dailyRate * nights;
  const cleaningFee = 150.00; // Flat fee
  const serviceFee = subtotal * 0.05; // 5% platform fee
  const tax = subtotal * 0.10; // 10% state tax
  const grandTotal = subtotal + cleaningFee + serviceFee + tax;

  return {
    nights,
    dailyRate,
    subtotal,
    cleaningFee,
    serviceFee,
    tax,
    grandTotal
  };
};

export const stripeService = {
  /**
   * Generates a Stripe PaymentIntent with idempotency keys for a confirmed booking
   */
  createPaymentIntent: async (bookingId, tenantId) => {
    // 1. Fetch booking with property details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true }
    });

    if (!booking) {
      const err = new Error("Booking not found");
      err.statusCode = 404;
      throw err;
    }

    // 2. Security validation checks
    if (booking.tenantId !== tenantId) {
      const err = new Error("Forbidden: You are not authorized to pay for this booking");
      err.statusCode = 403;
      throw err;
    }

    if (booking.status !== "CONFIRMED") {
      const err = new Error(`Payment Rejected: Booking must be CONFIRMED by landlord before payment (current status: ${booking.status})`);
      err.statusCode = 400;
      throw err;
    }

    if (booking.paymentStatus === "PAID") {
      const err = new Error("Conflict: This booking has already been paid for");
      err.statusCode = 409;
      throw err;
    }

    // 3. Compute costs on backend
    const costs = calculateBookingCost(booking.property.rent, booking.checkIn, booking.checkOut);

    // 4. Implement Idempotency: Check if a PENDING payment already exists for this booking
    const existingPendingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        status: "PENDING"
      }
    });

    if (existingPendingPayment) {
      console.log(`ℹ️  [StripeService]: Found existing pending PaymentIntent for booking: ${bookingId}`);
      return {
        clientSecret: `${existingPendingPayment.stripePaymentIntentId}_secret_mock`, // Simulate client secret format
        paymentIntentId: existingPendingPayment.stripePaymentIntentId,
        amount: Number(existingPendingPayment.amount),
        currency: existingPendingPayment.currency
      };
    }

    // Generate unique idempotency key based on bookingId and current attempt
    const attemptCount = await prisma.payment.count({ where: { bookingId } });
    const attemptNumber = attemptCount + 1;
    const idempotencyKey = `idemp-${bookingId}-att-${attemptNumber}`;

    // Convert total to cents for Stripe
    const amountInCents = Math.round(costs.grandTotal * 100);

    // 5. Invoke Stripe API
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: "usd",
          metadata: {
            bookingId,
            tenantId,
            landlordId: booking.property.landlordId
          }
        },
        {
          idempotencyKey // Attach key to prevent charge retries
        }
      );
    } catch (stripeErr) {
      console.error("💥 [Stripe SDK Create Error]:", stripeErr.message);
      const err = new Error(`Stripe Gateway Error: ${stripeErr.message}`);
      err.statusCode = 502;
      throw err;
    }

    // 6. Persist Payment Intent in database in PENDING status
    await prisma.payment.create({
      data: {
        bookingId,
        tenantId,
        landlordId: booking.property.landlordId,
        stripePaymentIntentId: paymentIntent.id,
        amount: costs.grandTotal,
        currency: "usd",
        status: "PENDING",
        paymentMethod: "CARD",
        attemptNumber,
        idempotencyKey
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: costs.grandTotal,
      currency: "usd"
    };
  }
};
