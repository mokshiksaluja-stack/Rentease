import { MessageSquare, CalendarRange, CheckCircle2, XCircle, Ban, BadgePercent, ShieldAlert } from "lucide-react";

export const NOTIFICATION_CONFIG = {
  BOOKING_CREATED: {
    label: "Booking Request",
    color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
    icon: CalendarRange,
    route: "/dashboard/bookings"
  },
  BOOKING_APPROVED: {
    label: "Approved",
    color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    icon: CheckCircle2,
    route: "/dashboard/bookings"
  },
  BOOKING_REJECTED: {
    label: "Rejected",
    color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    icon: XCircle,
    route: "/dashboard/bookings"
  },
  BOOKING_CANCELLED: {
    label: "Cancelled",
    color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    icon: Ban,
    route: "/dashboard/bookings"
  },
  MESSAGE_RECEIVED: {
    label: "Message",
    color: "text-sky-400 border-sky-500/20 bg-sky-500/10",
    icon: MessageSquare,
    route: "/dashboard/bookings" // Clicks will redirect to messages tab / chat page
  },
  PROPERTY_APPROVED: {
    label: "Listing Approved",
    color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    icon: CheckCircle2,
    route: "/properties"
  },
  PROPERTY_REJECTED: {
    label: "Listing Rejected",
    color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    icon: XCircle,
    route: "/properties"
  },
  PAYMENT_SUCCESS: {
    label: "Payment Success",
    color: "text-teal-400 border-teal-500/20 bg-teal-500/10",
    icon: BadgePercent,
    route: "/dashboard/bookings"
  },
  PAYMENT_FAILED: {
    label: "Payment Failed",
    color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    icon: ShieldAlert,
    route: "/dashboard/bookings"
  }
};
