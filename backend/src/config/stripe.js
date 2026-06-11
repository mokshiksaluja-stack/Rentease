import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let isSimulationMode = false;
let stripeInstance = null;

if (!stripeSecretKey || stripeSecretKey === "your_stripe_secret_key") {
  console.warn("⚠️  [Stripe Config]: STRIPE_SECRET_KEY is missing or set to placeholder. RentEase will operate in PAYMENT SIMULATION MODE.");
  isSimulationMode = true;

  // Mock Stripe instance supporting PaymentIntents and Webhook signature bypasses
  stripeInstance = {
    paymentIntents: {
      create: async (params, options) => {
        console.log("💳 [Stripe Simulation]: Creating mock PaymentIntent for amount:", params.amount);
        const id = "pi_mock_" + Math.random().toString(36).substring(2, 15);
        return {
          id,
          client_secret: `${id}_secret_${Math.random().toString(36).substring(2, 8)}`,
          amount: params.amount,
          currency: params.currency,
          status: "requires_payment_method",
          metadata: params.metadata || {}
        };
      },
      retrieve: async (id) => {
        console.log("💳 [Stripe Simulation]: Retrieving mock PaymentIntent ID:", id);
        return {
          id,
          amount: 10000,
          status: "succeeded",
          metadata: {}
        };
      }
    },
    webhooks: {
      constructEvent: (rawBody, signature, secret) => {
        // Construct mock event directly from body
        try {
          const parsed = JSON.parse(rawBody.toString());
          return parsed;
        } catch {
          throw new Error("Invalid mock webhook JSON payload");
        }
      }
    }
  };
} else {
  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16" // Lock standard API version
  });
  console.log("🔌 [Stripe Config]: Stripe SDK initialized successfully.");
}

export { stripeInstance as stripe, isSimulationMode };
export default stripeInstance;
