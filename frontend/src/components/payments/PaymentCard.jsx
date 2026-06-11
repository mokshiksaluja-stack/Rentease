import React from "react";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck } from "lucide-react";

export const PaymentCard = ({ cardholderName = "Cardholder Name", expiry = "MM/YY", last4 = "••••" }) => {
  return (
    <motion.div
      initial={{ transform: "perspective(1000px) rotateX(15deg)" }}
      whileHover={{ transform: "perspective(1000px) rotateX(0deg) scale(1.02)", y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative w-full h-48 sm:h-52 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-2xl overflow-hidden border border-white/20 select-none mx-auto max-w-sm mb-6"
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-black/20 rounded-full blur-xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-100/70 font-semibold">RentEase Secure</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Secured by Stripe</span>
          </div>
        </div>
        <CreditCard className="w-8 h-8 text-white/80" />
      </div>

      {/* Card Chip Icon */}
      <div className="mt-6 relative z-10">
        <div className="w-10 h-8 bg-amber-400/90 rounded-md border border-amber-500/20 relative overflow-hidden">
          <div className="absolute inset-y-0 left-1/3 w-[1px] bg-amber-600/30" />
          <div className="absolute inset-y-0 right-1/3 w-[1px] bg-amber-600/30" />
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-600/30" />
        </div>
      </div>

      {/* Card Number preview */}
      <div className="mt-4 text-lg sm:text-xl font-mono tracking-widest font-semibold relative z-10">
        ••••  ••••  ••••  {last4 === "••••" ? "••••" : last4}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-end mt-4 relative z-10">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-white/60 font-semibold">Card Holder</div>
          <div className="text-xs font-medium tracking-wide uppercase line-clamp-1 max-w-[200px]">
            {cardholderName || "CARDHOLDER NAME"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wider text-white/60 font-semibold">Expires</div>
          <div className="text-xs font-mono font-medium">{expiry || "MM/YY"}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentCard;
