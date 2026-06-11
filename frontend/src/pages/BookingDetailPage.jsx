// RentEase Booking Details Page
// Displays billing receipts, contact information, notes, and visual progress timeline.

import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Home, 
  DollarSign, 
  Clock, 
  Slash,
  AlertTriangle,
  FileText,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useBookings } from "../hooks/useBookings.js";
import { STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "../constants/bookingStatusConfig.js";

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const bookingsHook = useBookings();

  // 1. Query: Fetch booking details
  const { data: booking, isLoading, isError } = bookingsHook.useBookingDetails(id);

  // 2. Mutation: Cancel booking
  const cancelMutation = bookingsHook.useCancelBooking();

  const handleCancelSubmit = (e) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to cancel this reservation? This action is permanent.")) {
      cancelMutation.mutate({
        id,
        cancellationReason: cancelReasonInput || "Cancelled by user"
      }, {
        onSuccess: () => {
          setShowCancelPrompt(false);
          setCancelReasonInput("");
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin"></div>
        <p className="text-sm text-slate-400 font-light">Loading booking audit logs...</p>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 px-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-slate-100">Booking File Not Found</h2>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          The booking record does not exist, or you lack access permissions to view this transaction file.
        </p>
        <Link to="/dashboard/bookings" className="btn-primary mt-4 py-2.5 px-6">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Visual status config
  const statusCfg = STATUS_CONFIG[booking.status] || {};
  const paymentCfg = PAYMENT_STATUS_CONFIG[booking.paymentStatus] || {};
  const StatusIcon = statusCfg.icon || Calendar;

  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
  const dailyRate = Number(booking.property?.rent || 0);

  const isLandlord = user?.role === "LANDLORD";
  const contactProfile = isLandlord ? booking.tenant : booking.landlord;
  const isCancellable = booking.status === "PENDING" || booking.status === "CONFIRMED";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-5xl mx-auto px-6 space-y-8 text-left">
        
        {/* Navigation header */}
        <div className="space-y-3">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-400" />
              <span>Booking Reference: {booking.bookingReference}</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-xl font-extrabold ${statusCfg.badgeClass}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusCfg.label}</span>
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-xl font-extrabold ${paymentCfg.badgeClass}`}>
                <span>Payment: {paymentCfg.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Layout details columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns - Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Property information card */}
            <div className="glass-card rounded-2xl p-6 border border-slate-700 flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-24 h-24 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-850">
                {booking.property?.image ? (
                  <img src={booking.property.image} className="w-full h-full object-cover" alt="listing" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Home className="w-8 h-8 text-slate-700" /></div>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[9px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-md font-semibold uppercase">
                  Rental Agreement
                </span>
                <h3 className="font-bold text-base text-slate-200 mt-1">{booking.property?.title}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  <span>{booking.property?.address}, {booking.property?.city}, {booking.property?.state}</span>
                </p>
                <div className="flex items-center gap-4 pt-2 text-[10px] text-slate-500">
                  <span>{booking.property?.bedrooms} Bedrooms</span>
                  <span>•</span>
                  <span>{booking.property?.bathrooms} Bathrooms</span>
                </div>
              </div>
            </div>

            {/* Profile info cards */}
            <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-4">
              <h3 className="font-bold text-sm text-slate-200 border-b border-slate-700 pb-2">
                {isLandlord ? "Tenant Information" : "Owner Information"}
              </h3>
              {contactProfile ? (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-slate-850 flex-shrink-0 flex items-center justify-center">
                    {contactProfile.avatar ? (
                      <img src={contactProfile.avatar} className="w-full h-full object-cover" alt="avatar" />
                    ) : (
                      <User className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div className="text-left space-y-0.5">
                    <h4 className="font-bold text-sm text-slate-200">{contactProfile.name}</h4>
                    <p className="text-xs text-slate-400">{contactProfile.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Profile contact info not available.</p>
              )}
            </div>

            {/* Receipt price calculation details card */}
            <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-4">
              <h3 className="font-bold text-sm text-slate-200 border-b border-slate-700 pb-2">
                Cost Breakdown
              </h3>
              <div className="space-y-3 text-xs text-slate-400">
                {(() => {
                  const dailyRate2 = Number(booking.property?.rent || 0) / 30;
                  const subtotal = dailyRate2 * totalNights;
                  const cleaningFee = 150;
                  const serviceFee = subtotal * 0.05;
                  const tax = subtotal * 0.10;
                  const grandTotal = subtotal + cleaningFee + serviceFee + tax;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Prorated Daily Rent (${dailyRate2.toFixed(2)}/day × {totalNights} nights)</span>
                        <span className="text-white">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleaning Fee (Flat)</span>
                        <span className="text-white">${cleaningFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fee (5% platform fee)</span>
                        <span className="text-white">${serviceFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Occupancy Tax (10%)</span>
                        <span className="text-white">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-slate-700 font-extrabold text-sm text-slate-200">
                        <span>Total Amount Due</span>
                        <span className="text-emerald-400">${grandTotal.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Notes / Special Requests card */}
            {(booking.notes || booking.cancellationReason) && (
              <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-4">
                {booking.notes && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant Notes</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-light">{booking.notes}</p>
                  </div>
                )}
                {booking.cancellationReason && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-700">
                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Cancellation Reason</h4>
                    <p className="text-xs text-red-300/80 leading-relaxed font-light">{booking.cancellationReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Pay Now CTA — Tenant only, CONFIRMED booking, NOT yet paid */}
            {!isLandlord && booking.status === "CONFIRMED" && booking.paymentStatus !== "PAID" && (
              <Link
                to={`/dashboard/payments/pay/${id}`}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-indigo-500/20 text-sm"
              >
                <CreditCard className="w-4 h-4" />
                Complete Payment — Pay Rent Now
              </Link>
            )}

            {/* Paid indicator */}
            {booking.paymentStatus === "PAID" && (
              <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl py-4 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4.5 h-4.5" />
                Rent Payment Received
              </div>
            )}

            {/* Cancel actions buttons panel */}
            {isCancellable && !showCancelPrompt && (
              <button
                onClick={() => setShowCancelPrompt(true)}
                className="w-full bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-700 text-xs font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center space-x-1.5"
              >
                <Slash className="w-3.5 h-3.5" />
                <span>Cancel Reservation Request</span>
              </button>
            )}

            {showCancelPrompt && (
              <form onSubmit={handleCancelSubmit} className="glass-card rounded-2xl p-5 border border-red-500/20 bg-red-950/5 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-red-400">cancellation reason</h4>
                  <p className="text-[10px] text-slate-400 font-light">Please explain the reason for canceling this reservation request.</p>
                </div>
                <input
                  type="text"
                  placeholder="E.g., Travel plans changed, booked different property..."
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                />
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(false)}
                    className="btn-secondary py-2 px-3 text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={cancelMutation.isLoading}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-3 rounded-lg text-xs"
                  >
                    {cancelMutation.isLoading ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Right Column - Timeline Stepper */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-6 sticky top-28">
              <h3 className="font-bold text-sm text-slate-200 border-b border-slate-700 pb-2">
                Booking Timeline
              </h3>
              
              {/* Stepper Grid Container */}
              <div className="relative pl-6 border-l border-slate-700 space-y-6">
                {booking.timeline && booking.timeline.map((event) => {
                  const evCfg = STATUS_CONFIG[event.status.replace("BOOKING_", "")] || {};
                  const EvIcon = evCfg.icon || Clock;
                  
                  return (
                    <div key={event.id} className="relative text-xs">
                      {/* Left timeline circle dot */}
                      <span className={`absolute -left-[31px] top-0 p-1 rounded-full border border-slate-950 ${evCfg.badgeClass || "bg-slate-900 text-slate-500"}`}>
                        <EvIcon className="w-2.5 h-2.5" />
                      </span>
                      
                      {/* Info Details */}
                      <div className="space-y-0.5 text-left">
                        <h4 className="font-bold text-slate-200">{evCfg.label || event.status}</h4>
                        <span className="text-[9px] text-slate-500 font-light block">
                          {new Date(event.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {event.note && (
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-light whitespace-pre-line">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {booking.timeline?.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-left">No timeline audits logged.</p>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BookingDetailPage;
