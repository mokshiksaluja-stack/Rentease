import { stripe, isSimulationMode } from "../config/stripe.js";
import { paymentRepository } from "../repositories/payment.repository.js";
import { paymentService } from "../services/payment.service.js";

export const stripeWebhookHandler = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // 1. Parse and verify event authenticity
    if (isSimulationMode || !sig || !webhookSecret || webhookSecret === "your_stripe_webhook_secret") {
      if (isSimulationMode) {
        console.log("ℹ️  [Stripe Webhook]: Bypassing signature verification (Simulation Mode).");
      }
      
      // Parse payload directly in simulation mode
      const rawBody = req.body;
      event = typeof rawBody === "object" ? rawBody : JSON.parse(rawBody.toString());
    } else {
      // Direct raw parsing using official Stripe SDK signature verifications
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err) {
    console.error("💥 [Stripe Webhook Verification Failed]:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // In simulation mode, Stripe events may not have an id field — generate a fallback
  const eventId = event.id || `sim_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const eventType = event.type;

  try {
    // 2. Idempotency protection check: Only run for real Stripe event IDs (prefixed with "evt_")
    if (event.id && event.id.startsWith("evt_")) {
      const alreadyProcessed = await paymentRepository.findWebhookEvent(event.id);
      if (alreadyProcessed) {
        console.log(`ℹ️  [Stripe Webhook]: Event "${event.id}" has already been processed. Ignoring duplicate.`);
        return res.status(200).json({ processed: true, message: "Duplicate event skipped" });
      }
    }

    console.log(`🔌 [Stripe Webhook]: Received event "${eventId}" of type: ${eventType}`);

    // 3. Route specific event notifications
    switch (eventType) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`✅ [Stripe Webhook]: Payment succeeded for intent: ${paymentIntent.id}`);
        await paymentService.confirmPayment(paymentIntent.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const reason = paymentIntent.last_payment_error?.message || "Payment method declined";
        console.log(`❌ [Stripe Webhook]: Payment failed for intent: ${paymentIntent.id}. Reason: ${reason}`);
        await paymentService.failPayment(paymentIntent.id, reason);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        console.log(`🔄 [Stripe Webhook]: Charge refunded for intent: ${paymentIntentId}`);
        if (paymentIntentId) {
          await paymentService.refundPayment(paymentIntentId);
        }
        break;
      }
      default:
        console.log(`ℹ️  [Stripe Webhook]: Unhandled event type: ${eventType}`);
    }

    // 4. Mark real Stripe webhook event IDs as processed (dedup protection for production)
    if (event.id && event.id.startsWith("evt_")) {
      await paymentRepository.createWebhookEvent(event.id, eventType);
    }

    res.status(200).json({ received: true, eventType });
  } catch (err) {
    console.error(`💥 [Stripe Webhook Process Error] (Event: ${eventId}):`, err.message);
    next(err);
  }
};
