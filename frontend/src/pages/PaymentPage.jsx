// RentEase PaymentPage — Stripe Checkout Gateway
// Handles payment intent creation, simulated confirmation, success/failure screens.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  FileText,
  AlertTriangle
} from "lucide-react";
import { useBookings } from "../hooks/useBookings.js";
import { usePayments } from "../hooks/usePayments.js";
import { PaymentSummary } from "../components/payments/PaymentSummary.jsx";
import { PaymentCard } from "../components/payments/PaymentCard.jsx";

// ----- Simulated Card Form (No real Stripe Elements in sim mode) -----
const SimulatedCardForm = ({ onSubmit, isLoading }) => {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const formatCardNumber = (val) =>
    val
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    return clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ cardName, cardNumber, expiry, cvv });
  };

  const last4 = cardNumber.replace(/\s/g, "").slice(-4) || "••••";
  const expiryDisplay = expiry || "MM/YY";

  return (
    <div className="space-y-6">
      {/* Live Card Preview */}
      <PaymentCard
        cardholderName={cardName || "CARDHOLDER NAME"}
        expiry={expiryDisplay}
        last4={last4 !== "••••" ? last4 : "••••"}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Cardholder Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            required
            className="w-full bg-slate-900 border border-slate-700 focus:border-brand-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none transition text-sm font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              required
              className="w-full bg-slate-900 border border-slate-700 focus:border-brand-500 rounded-xl pl-4 pr-12 py-3 text-slate-100 placeholder-slate-400 focus:outline-none transition text-sm font-mono tracking-widest"
            />
            <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Expiry Date
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              required
              className="w-full bg-slate-900 border border-slate-700 focus:border-brand-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none transition text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              CVV <Lock className="w-3 h-3 text-slate-500" />
            </label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="•••"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
              className="w-full bg-slate-900 border border-slate-700 focus:border-brand-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none transition text-sm font-mono"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-sm text-sm mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pay Securely Now
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// ----- Success Screen -----
const SuccessScreen = ({ bookingId, amount }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-sm"
      >
        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
      </motion.div>
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-100">Payment Successful!</h2>
        <p className="text-slate-400 max-w-sm font-light">
          Your rent payment of{" "}
          <span className="text-emerald-600 font-bold">₹{Number(amount).toFixed(2)}</span> has
          been processed. A PDF receipt is being generated and will be emailed to you.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={() => navigate(`/dashboard/bookings/${bookingId}`)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition text-sm shadow-sm"
        >
          <FileText className="w-4 h-4" />
          View Booking Details
        </button>
        <button
          onClick={() => navigate("/dashboard/payments/history")}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold py-3 px-6 rounded-xl transition text-sm shadow-sm"
        >
          Payment History
        </button>
      </div>
    </motion.div>
  );
};

// ----- Failure Screen -----
const FailureScreen = ({ onRetry, errorMessage }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
      className="w-24 h-24 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shadow-sm"
    >
      <XCircle className="w-12 h-12 text-rose-600" />
    </motion.div>
    <div className="space-y-2">
      <h2 className="text-3xl font-extrabold text-slate-100">Payment Failed</h2>
      <p className="text-slate-400 max-w-sm">
        {errorMessage || "Your payment could not be processed. Please check your card details and try again."}
      </p>
    </div>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 px-6 rounded-xl transition text-sm shadow-sm"
    >
      <RefreshCw className="w-4 h-4" />
      Try Again
    </button>
  </motion.div>
);

// ----- Main Page Component -----
const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [paymentState, setPaymentState] = useState("form"); // form | processing | success | failure
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [intentData, setIntentData] = useState(null);

  const bookingsHook = useBookings();
  const paymentsHook = usePayments();

  const { data: booking, isLoading: loadingBooking, isError: bookingError } =
    bookingsHook.useBookingDetails(bookingId);

  const createIntentMutation = paymentsHook.useCreatePaymentIntent();
  const confirmMutation = paymentsHook.useConfirmPaymentSimulated();

  // Create payment intent on page load
  useEffect(() => {
    if (bookingId && !intentData) {
      createIntentMutation.mutate(
        { bookingId },
        {
          onSuccess: (data) => setIntentData(data),
          onError: (err) => {
            setErrorMessage(err.response?.data?.message || "Failed to initialize checkout");
            setPaymentState("failure");
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handlePaySubmit = async () => {
    if (!intentData?.paymentIntentId) return;
    setPaymentState("processing");

    confirmMutation.mutate(
      { paymentIntentId: intentData.paymentIntentId },
      {
        onSuccess: (data) => {
          setPaymentResult(data);
          setPaymentState("success");
        },
        onError: (err) => {
          setErrorMessage(err.response?.data?.message || "Card declined. Please try again.");
          setPaymentState("failure");
        }
      }
    );
  };

  // Loading State
  if (loadingBooking || (createIntentMutation.isPending && !intentData)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
        <p className="text-slate-400 text-sm font-light animate-pulse">Initializing secure checkout...</p>
      </div>
    );
  }

  // Error State — booking not accessible
  if (bookingError || !booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-100">Booking Not Found</h2>
        <p className="text-slate-400 max-w-xs">
          The booking you are trying to pay for doesn't exist or you don't have access.
        </p>
        <Link to="/dashboard/bookings" className="btn-primary mt-4 py-3 px-6">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Back Navigation */}
        <button
          onClick={() => navigate(`/dashboard/bookings/${bookingId}`)}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-600 transition text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Booking
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 rounded-xl border border-brand-200">
              <Lock className="w-6 h-6 text-brand-600" />
            </div>
            Secure Checkout
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-light">
            Your payment is encrypted and protected by Stripe.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT — Payment Summary */}
          <div className="space-y-6">
            <PaymentSummary
              property={booking?.property}
              checkIn={booking?.checkIn}
              checkOut={booking?.checkOut}
            />

            {/* Security Trust Section */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-slate-100 font-semibold text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Payment Security
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "🔐", label: "256-bit SSL Encryption" },
                  { icon: "🏦", label: "Stripe PCI DSS Compliant" },
                  { icon: "🔒", label: "Idempotency Protected" },
                  { icon: "📄", label: "PDF Receipt Generated" }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 bg-slate-800/50 rounded-xl px-3.5 py-2.5 border border-slate-700/50">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-slate-300 text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Payment Form / Result Screen */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-sm">
            <AnimatePresence mode="wait">
              {paymentState === "success" ? (
                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SuccessScreen
                    bookingId={bookingId}
                    amount={intentData?.amount || 0}
                  />
                </motion.div>
              ) : paymentState === "failure" ? (
                <motion.div key="failure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <FailureScreen
                    errorMessage={errorMessage}
                    onRetry={() => setPaymentState("form")}
                  />
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-100">Card Details</h2>
                    <p className="text-slate-500 text-xs mt-1">
                      {intentData
                        ? `Paying ₹${Number(intentData.amount).toFixed(2)} ${(intentData.currency || "inr").toUpperCase()}`
                        : "Initializing payment..."}
                    </p>
                    {/* Simulation mode notice */}
                    <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 text-xs font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Simulation Mode — No real charges will be made. Use any card details.</span>
                    </div>
                  </div>

                  <SimulatedCardForm
                    onSubmit={handlePaySubmit}
                    isLoading={paymentState === "processing" || confirmMutation.isPending}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
