import React from "react";
import { Download, Calendar, Landmark, Receipt, AlertCircle, Hash, RefreshCcw } from "lucide-react";
import PaymentStatusBadge from "./PaymentStatusBadge";

export const ReceiptCard = ({ payment }) => {
  if (!payment) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-950 border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden print:border-0 print:bg-white print:text-black">
      {/* Decorative background logo */}
      <div className="absolute -top-10 -right-10 text-slate-900 pointer-events-none print:hidden">
        <Receipt className="w-40 h-40" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-700 print:border-slate-200">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest print:text-slate-600">Receipt Details</span>
          <h2 className="text-2xl font-bold text-slate-100 mt-1 print:text-black flex items-center gap-2">
            Invoice Statement
          </h2>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-700 print:border-slate-200">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-slate-500 mt-0.5 print:text-slate-400" />
            <div>
              <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Transaction ID</div>
              <div className="text-slate-300 font-mono text-xs mt-0.5 break-all print:text-slate-800">
                {payment.stripePaymentIntentId}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-500 mt-0.5 print:text-slate-400" />
            <div>
              <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Processed Date</div>
              <div className="text-slate-300 text-sm mt-0.5 print:text-slate-800">
                {formatDate(payment.processedAt || payment.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Landmark className="w-5 h-5 text-slate-500 mt-0.5 print:text-slate-400" />
            <div>
              <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Payment Method</div>
              <div className="text-slate-300 text-sm mt-0.5 print:text-slate-800">
                Credit Card (via Stripe)
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <RefreshCcw className="w-5 h-5 text-slate-500 mt-0.5 print:text-slate-400" />
            <div>
              <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Payment Attempt</div>
              <div className="text-slate-300 text-sm mt-0.5 print:text-slate-800">
                Attempt #{payment.attemptNumber || 1}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Bill From info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-700 print:border-slate-200">
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold print:text-slate-600">Tenant / Payee</div>
          <div className="text-white font-semibold mt-1 print:text-black">{payment.booking?.tenant?.name}</div>
          <div className="text-slate-400 text-sm mt-0.5 print:text-slate-700">{payment.booking?.tenant?.email}</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold print:text-slate-600">Landlord / Recipient</div>
          <div className="text-white font-semibold mt-1 print:text-black">{payment.booking?.property?.landlord?.name}</div>
          <div className="text-slate-400 text-sm mt-0.5 print:text-slate-700">{payment.booking?.property?.landlord?.email}</div>
        </div>
      </div>

      {/* Financial Details Summary */}
      <div className="py-6">
        <div className="flex justify-between items-center bg-slate-800 border border-slate-700 rounded-xl p-4 print:bg-slate-100 print:border-slate-200">
          <div>
            <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold print:text-slate-600">Total Charged</div>
            <div className="text-slate-500 text-[10px] print:text-slate-600">All fees, service taxes, and cleanings included</div>
          </div>
          <div className="text-emerald-400 font-extrabold text-2xl print:text-emerald-700">
            ${Number(payment.amount).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Download Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4 print:hidden">
        {payment.receiptUrl ? (
          <a
            href={payment.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 border border-emerald-500/20 shadow-lg shadow-emerald-500/10 text-sm cursor-pointer"
          >
            <Download className="w-4.5 h-4.5" />
            Download PDF Receipt
          </a>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 text-slate-500 py-3 px-4 rounded-xl text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            PDF Invoice Generating...
          </div>
        )}
        <button
          onClick={handlePrint}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-xl transition duration-200 text-sm cursor-pointer"
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
};

export default ReceiptCard;
