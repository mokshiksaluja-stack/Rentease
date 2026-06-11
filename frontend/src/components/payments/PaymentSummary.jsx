import React from "react";
import { Calendar, IndianRupee, Home } from "lucide-react";

export const PaymentSummary = ({ property, checkIn, checkOut }) => {
  // Same calculation logic as backend to display estimated breakdown
  const calculateCosts = () => {
    if (!property || !checkIn || !checkOut) return null;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    const dailyRate = Number(property.rent) / 30;
    const subtotal = dailyRate * nights;
    const cleaningFee = 150.00;
    const serviceFee = subtotal * 0.05;
    const tax = subtotal * 0.10;
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

  const costs = calculateCosts();

  if (!property || !costs) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-400">
        No payment summary information available.
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Property Details Header */}
      <div className="flex gap-4 items-start pb-6 border-b border-slate-700">
        {property.images && property.images[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-20 h-20 object-cover rounded-xl border border-slate-700 shadow-inner"
          />
        ) : (
          <div className="w-20 h-20 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 border border-slate-700">
            <Home className="w-8 h-8" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-slate-100 font-semibold text-lg line-clamp-1">{property.title}</h3>
          <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">{property.location}</p>
          <div className="flex items-center gap-1.5 mt-2 text-emerald-400 font-medium text-sm">
            <IndianRupee className="w-4 h-4 -mr-1" />
            <span>{property.rent}</span>
            <span className="text-slate-500 text-xs font-normal">/ month</span>
          </div>
        </div>
      </div>

      {/* Booking Period */}
      <div className="py-4 border-b border-slate-700 flex flex-col sm:flex-row gap-4 justify-between text-sm">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-500" />
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Stay Duration</div>
            <div className="text-slate-300 font-medium mt-0.5">
              {formatDate(checkIn)} — {formatDate(checkOut)}
            </div>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Total Stay</div>
          <div className="text-white font-bold text-base mt-0.5">
            {costs.nights} {costs.nights === 1 ? "night" : "nights"}
          </div>
        </div>
      </div>

      {/* Invoice Breakdown list */}
      <div className="pt-5 space-y-3">
        <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-2">Cost Breakdown</h4>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">
            Base Rent ({costs.nights} nights x ₹{costs.dailyRate.toFixed(2)}/day)
          </span>
          <span className="text-white font-medium">₹{costs.subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Cleaning Fee (Flat)</span>
          <span className="text-white font-medium">₹{costs.cleaningFee.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Service Fee (5% platform fee)</span>
          <span className="text-white font-medium">₹{costs.serviceFee.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Occupancy Tax & VAT (10%)</span>
          <span className="text-white font-medium">₹{costs.tax.toFixed(2)}</span>
        </div>

        {/* Highlighted Total */}
        <div className="flex justify-between pt-4 mt-2 border-t border-slate-700">
          <span className="text-white font-semibold text-base">Total Amount</span>
          <span className="text-emerald-400 font-extrabold text-xl sm:text-2xl">
            ₹{costs.grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Security badge wrapper */}
      <div className="mt-6 flex items-center justify-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-emerald-400/90 text-xs font-medium">
        <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span>Calculations certified & verified securely by RentEase</span>
      </div>
    </div>
  );
};

export default PaymentSummary;
