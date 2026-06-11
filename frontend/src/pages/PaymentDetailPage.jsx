// RentEase Payment Detail Page
// Renders full transaction metadata, cost breakdown, receipt actions, and booking link.

import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, FileText, DollarSign } from "lucide-react";
import { usePayments } from "../hooks/usePayments.js";
import { ReceiptCard } from "../components/payments/ReceiptCard.jsx";
import { PaymentStatusBadge } from "../components/payments/PaymentStatusBadge.jsx";

const PaymentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { usePaymentDetails } = usePayments();
  const { data: payment, isLoading, isError } = usePaymentDetails(id);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm font-light animate-pulse">Loading payment record...</p>
      </div>
    );
  }

  // Error State
  if (isError || !payment) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-100">Transaction Not Found</h2>
        <p className="text-slate-400 max-w-xs text-sm">
          This payment record does not exist or you don't have permission to view it.
        </p>
        <button
          onClick={() => navigate("/dashboard/payments/history")}
          className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl text-sm transition"
        >
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Back nav */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-600 transition text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
 
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 rounded-xl border border-brand-200">
                  <DollarSign className="w-6 h-6 text-brand-600" />
                </div>
                Transaction Detail
              </h1>
              <p className="text-slate-500 text-xs mt-1.5 font-mono">
                ID: {payment.stripePaymentIntentId}
              </p>
            </div>
            <PaymentStatusBadge status={payment.status} />
          </div>
        </div>

        {/* Receipt Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ReceiptCard payment={payment} />
        </motion.div>

        {/* Amount Highlight Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 text-center">
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Amount Charged</div>
            <div className="text-emerald-600 font-extrabold text-2xl mt-1">₹{Number(payment.amount).toFixed(2)}</div>
            <div className="text-slate-600 text-xs mt-0.5 uppercase font-mono">{payment.currency}</div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 text-center">
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Payment Method</div>
            <div className="text-slate-100 font-bold text-base mt-2">Credit Card</div>
            <div className="text-slate-500 text-xs mt-0.5">via Stripe</div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 text-center">
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Attempt #</div>
            <div className="text-slate-100 font-extrabold text-2xl mt-1">{payment.attemptNumber || 1}</div>
            <div className="text-slate-600 text-xs mt-0.5">payment attempt</div>
          </div>
        </motion.div>

        {/* Booking Link */}
        {payment.booking?.bookingReference && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Link
              to={`/dashboard/bookings/${payment.bookingId}`}
              className="flex items-center justify-between bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl p-5 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 group-hover:border-brand-300 transition">
                  <FileText className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition" />
                </div>
                <div>
                  <div className="text-slate-100 font-semibold text-sm">Linked Booking</div>
                  <div className="text-slate-500 text-xs mt-0.5 font-mono">#{payment.booking.bookingReference}</div>
                </div>
              </div>
              <div className="text-slate-500 group-hover:text-brand-600 text-xs flex items-center gap-1 transition">
                View Booking
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Failure Info */}
        {payment.status === "FAILED" && payment.failureReason && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5"
          >
            <AlertTriangle className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-rose-700 font-semibold text-sm">Payment Declined</div>
              <p className="text-rose-600 text-xs mt-1 font-light leading-relaxed">{payment.failureReason}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetailPage;
