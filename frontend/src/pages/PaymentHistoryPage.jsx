// RentEase Payment History Page
// Displays paginated list of all user payment transactions with filtering and sorting.

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Receipt,
  Search,
  DollarSign,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Calendar
} from "lucide-react";
import { usePayments } from "../hooks/usePayments.js";
import { PaymentStatusBadge } from "../components/payments/PaymentStatusBadge.jsx";

const PaymentHistoryPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { usePaymentHistory } = usePayments();

  const { data, isLoading, isError } = usePaymentHistory({
    page: String(currentPage),
    limit: "10",
    status: statusFilter
  });

  const payments = data?.payments || [];
  const pagination = data?.pagination || {};

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const statusOptions = ["", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"];
  const statusLabels = {
    "": "All Statuses",
    PENDING: "Pending",
    SUCCEEDED: "Succeeded",
    FAILED: "Failed",
    REFUNDED: "Refunded"
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
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
                  <Receipt className="w-6 h-6 text-brand-600" />
                </div>
                Payment History
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm font-light">
                All your rent transactions and payment records
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-900 border border-slate-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Filter</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => { setStatusFilter(opt); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === opt
                    ? "bg-brand-600 border-brand-500 text-white shadow-sm"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                }`}
              >
                {statusLabels[opt]}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 bg-slate-850 border border-slate-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-16 text-rose-600 space-y-3">
            <p className="font-semibold">Failed to load payment history.</p>
            <button onClick={() => window.location.reload()} className="text-xs text-slate-400 hover:text-brand-600 underline">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && payments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-5"
          >
            <div className="w-20 h-20 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center">
              <Receipt className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <h3 className="text-slate-100 font-bold text-lg">No Transactions Found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-xs">
                {statusFilter
                  ? `No ${statusLabels[statusFilter].toLowerCase()} payments yet.`
                  : "You haven't made any rent payments yet."}
              </p>
            </div>
            <Link
              to="/dashboard/bookings"
              className="btn-primary"
            >
              Go to Bookings
            </Link>
          </motion.div>
        )}

        {/* Payment List */}
        {!isLoading && !isError && payments.length > 0 && (
          <div className="space-y-3">
            {payments.map((payment, idx) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer transition-all duration-200 hover:shadow-sm"
                onClick={() => navigate(`/dashboard/payments/${payment.id}`)}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${
                  payment.status === "SUCCEEDED"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : payment.status === "FAILED"
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : payment.status === "REFUNDED"
                    ? "bg-brand-50 border-brand-200 text-brand-600"
                    : "bg-amber-50 border-amber-200 text-amber-600"
                }`}>
                  <DollarSign className="w-6 h-6" />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-slate-100 font-semibold text-sm truncate">
                      {payment.booking?.property?.title || "Rent Payment"}
                    </h3>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                    <span className="text-slate-400 text-xs font-mono truncate max-w-[200px]">
                      #{payment.stripePaymentIntentId?.slice(0, 20)}...
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(payment.processedAt || payment.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Amount + Arrow */}
                <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      payment.status === "SUCCEEDED"
                        ? "text-emerald-600"
                        : payment.status === "REFUNDED"
                        ? "text-brand-600"
                        : "text-slate-100"
                    }`}>
                      ₹{Number(payment.amount).toFixed(2)}
                    </div>
                    <div className="text-slate-400 text-xs font-mono uppercase">
                      {payment.currency || "inr"}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <p className="text-slate-500 text-xs">
              Showing {payments.length} of {pagination.totalItems} transactions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <span className="text-slate-400 text-sm font-medium px-2">
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage >= pagination.totalPages}
                className="p-2 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 transition"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
