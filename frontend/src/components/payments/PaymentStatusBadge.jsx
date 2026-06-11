import React from "react";
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

export const PaymentStatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: {
      label: "Pending",
      classes: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />
    },
    SUCCEEDED: {
      label: "Succeeded",
      classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: <CheckCircle className="w-3.5 h-3.5" />
    },
    FAILED: {
      label: "Failed",
      classes: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      icon: <XCircle className="w-3.5 h-3.5" />
    },
    REFUNDED: {
      label: "Refunded",
      classes: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      icon: <AlertTriangle className="w-3.5 h-3.5" />
    }
  };

  const current = statusConfig[status] || {
    label: status,
    classes: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    icon: <AlertTriangle className="w-3.5 h-3.5" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${current.classes}`}>
      {current.icon}
      {current.label}
    </span>
  );
};

export default PaymentStatusBadge;
