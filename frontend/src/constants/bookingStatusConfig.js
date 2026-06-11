// RentEase FrontEnd Booking Status UI Configuration
// Centralizes labels, badge styling classes, and icons to keep UI design unified.

import { 
  Hourglass, 
  CheckCircle, 
  XCircle, 
  Slash, 
  ClipboardCheck 
} from "lucide-react";

export const STATUS_CONFIG = {
  PENDING: {
    label: "Pending Review",
    badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    textClass: "text-amber-400",
    icon: Hourglass
  },
  CONFIRMED: {
    label: "Confirmed",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    textClass: "text-emerald-400",
    icon: CheckCircle
  },
  REJECTED: {
    label: "Declined",
    badgeClass: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    textClass: "text-rose-400",
    icon: XCircle
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    textClass: "text-slate-400",
    icon: Slash
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    textClass: "text-blue-400",
    icon: ClipboardCheck
  }
};

export const PAYMENT_STATUS_CONFIG = {
  UNPAID: {
    label: "Unpaid",
    badgeClass: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
  },
  PAID: {
    label: "Paid",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
  },
  REFUNDED: {
    label: "Refunded",
    badgeClass: "bg-slate-500/10 text-slate-400 border border-slate-500/20"
  }
};
