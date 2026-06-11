// RentEase Booking Dashboard Page
// Renders active bookings, pending requests, metrics summaries, searches, and status filters.

import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Calendar, 
  Search, 
  Filter, 
  IndianRupee, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  History,
  AlertCircle,
  MessageSquare,
  Bell,
  Home,
  TrendingUp,
  CreditCard,
  BarChart3
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useBookings } from "../hooks/useBookings.js";
import { usePayments } from "../hooks/usePayments.js";
import { STATUS_CONFIG } from "../constants/bookingStatusConfig.js";
import MessagesPage from "./MessagesPage.jsx";
import NotificationCenter from "../components/notifications/NotificationCenter.jsx";

const BookingDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "bookings";
  
  // 1. Search & Filter State variables
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Instantiating hooks coordinator
  const bookingsHook = useBookings();
  const paymentsHook = usePayments();
  
  // 2. Fetch User Bookings Query
  const { data: bookingsData, isLoading, isError, refetch } = bookingsHook.useUserBookings({
    page: String(currentPage),
    limit: "5", // 5 listings per page
    status: statusFilter,
    search: searchQuery,
    sortBy,
    sortOrder
  });

  // 3. Fetch Metrics Query
  const { data: stats, isLoading: isLoadingStats } = bookingsHook.useDashboardStats();

  // 4. Fetch Financial Analytics (landlord only)
  const { data: analyticsData, isLoading: isLoadingAnalytics } = paymentsHook.useFinancialAnalytics();

  // Approve / Reject Mutations
  const approveMutation = bookingsHook.useApproveBooking();
  const rejectMutation = bookingsHook.useRejectBooking();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset page on new search
  };

  const handleApprove = (id) => {
    if (window.confirm("Are you sure you want to approve this reservation request? This will confirm the booking and decline any conflicting pending requests.")) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id) => {
    const reason = window.prompt("Please enter a reason for declining this request (optional):");
    if (reason !== null) {
      rejectMutation.mutate({ id, cancellationReason: reason });
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const isLandlord = user?.role === "LANDLORD";
  const bookingsList = bookingsData?.bookings || [];
  const pagination = bookingsData?.pagination || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-6 space-y-8 text-left">
        
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-700 overflow-x-auto pb-px scrollbar-none gap-2 select-none">
          <button
            onClick={() => handleTabChange("bookings")}
            className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-sm whitespace-nowrap outline-none transition-all duration-200 ${
              activeTab === "bookings"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bookings</span>
          </button>
          
          <button
            onClick={() => handleTabChange("messages")}
            className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-sm whitespace-nowrap outline-none transition-all duration-200 ${
              activeTab === "messages"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </button>

          <button
            onClick={() => handleTabChange("notifications")}
            className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-sm whitespace-nowrap outline-none transition-all duration-200 ${
              activeTab === "notifications"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          {isLandlord && (
            <button
              onClick={() => handleTabChange("payments")}
              className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-sm whitespace-nowrap outline-none transition-all duration-200 ${
                activeTab === "payments"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Revenue</span>
            </button>
          )}
        </div>

        {/* Tab Contents */}
        {activeTab === "messages" ? (
          <MessagesPage />
        ) : activeTab === "notifications" ? (
          <NotificationCenter userId={user?.id} />
        ) : activeTab === "payments" && isLandlord ? (
          <div className="space-y-8">
            {/* Revenue Tab Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                  <span>Revenue Analytics</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1 font-light">Your financial performance at a glance</p>
              </div>
              <Link to="/dashboard/payments/history" className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center space-x-1.5 self-start">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>All Transactions</span>
              </Link>
            </div>

            {/* Analytics Summary Cards */}
            {isLoadingAnalytics ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-card rounded-2xl h-28 border border-slate-700 animate-pulse" />
                ))}
              </div>
            ) : analyticsData?.summary ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Total Revenue</span>
                    <h3 className="text-2xl font-black text-emerald-400">₹{Number(analyticsData.summary.totalRevenue || 0).toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><IndianRupee className="w-6 h-6" /></div>
                </div>

                <div className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Successful Payments</span>
                    <h3 className="text-2xl font-black text-slate-100">{analyticsData.summary.successCount || 0}</h3>
                  </div>
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500"><CheckCircle2 className="w-6 h-6" /></div>
                </div>

                <div className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Pending Payments</span>
                    <h3 className="text-2xl font-black text-amber-400">{analyticsData.summary.pendingCount || 0}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><Clock className="w-6 h-6" /></div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-10 rounded-2xl border border-slate-700 text-center text-slate-500 text-sm">
                No payment data available yet.
              </div>
            )}

            {/* Monthly Revenue Chart placeholder */}
            {analyticsData?.monthlyTrends && analyticsData.monthlyTrends.length > 0 && (
              <div className="glass-card rounded-2xl p-6 border border-slate-700">
                <h3 className="text-sm font-bold text-slate-200 mb-5 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Monthly Revenue Trends
                </h3>
                <div className="space-y-3">
                  {analyticsData.monthlyTrends.slice(-6).map((month) => {
                    const maxRevenue = Math.max(...analyticsData.monthlyTrends.map(m => m.revenue || 0), 1);
                    const barWidth = Math.round(((month.revenue || 0) / maxRevenue) * 100);
                    return (
                      <div key={month.month} className="flex items-center gap-4 group">
                        <div className="text-xs text-slate-500 font-mono w-14 text-right shrink-0">{month.month}</div>
                        <div className="flex-1 bg-slate-900 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-300 font-semibold w-20 text-right shrink-0">
                          ₹{Number(month.revenue || 0).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Title Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
                  <Calendar className="w-8 h-8 text-brand-500" />
                  <span>Booking Dashboard</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1 font-light">
                  {isLandlord ? "Manage reservation requests for your properties" : "Track status details for your property requests"}
                </p>
              </div>
              <Link to="/dashboard/bookings/history" className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center space-x-1.5 self-start">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>View Booking History</span>
              </Link>
            </div>

            {/* 1. Metrics Cards Section */}
            {isLoadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-card rounded-2xl h-28 border border-slate-700 animate-pulse"></div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLandlord ? (
                  <>
                    <div className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Pending Requests</span>
                        <h3 className="text-2xl font-black text-slate-100">{stats.pending}</h3>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><Clock className="w-6 h-6" /></div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Confirmed Stays</span>
                        <h3 className="text-2xl font-black text-slate-100">{stats.confirmed}</h3>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Projected Revenue</span>
                        <h3 className="text-2xl font-black text-slate-100">₹{stats.revenueEstimate.toLocaleString()}</h3>
                      </div>
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500"><IndianRupee className="w-6 h-6" /></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Pending Requests</span>
                        <h3 className="text-2xl font-black text-slate-100">{stats.pending}</h3>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><Clock className="w-6 h-6" /></div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Active Stays</span>
                        <h3 className="text-2xl font-black text-slate-100">{stats.active}</h3>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Completed Stays</span>
                        <h3 className="text-2xl font-black text-slate-100">{stats.completed}</h3>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><History className="w-6 h-6" /></div>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* 2. Search & Filter Bar */}
            <div className="glass-card rounded-2xl p-4 border border-slate-700 flex flex-col md:flex-row items-center gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-grow w-full relative flex items-center">
                <Search className="w-4 h-4 text-slate-500 absolute left-4" />
                <input
                  type="text"
                  placeholder="Search by reference code or listing title..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-200"
                />
              </form>

              <div className="flex w-full md:w-auto items-center gap-3">
                <div className="relative flex items-center w-full md:w-48">
                  <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-900 border border-slate-700 pl-9 pr-3 py-3 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="CONFIRMED">Confirmed</option>
                  </select>
                </div>

                <button 
                  type="button" 
                  onClick={handleResetFilters} 
                  className="btn-secondary py-3 px-4 text-xs font-semibold whitespace-nowrap"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* 3. Bookings Listings Grid */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-card rounded-2xl h-36 border border-slate-700 animate-pulse"></div>
                ))}
              </div>
            ) : isError ? (
              <div className="glass-card p-12 rounded-3xl border border-slate-700 text-center text-slate-400">
                <AlertCircle className="w-12 h-12 text-red-500/55 mx-auto mb-3" />
                <p>Failed to query reservations. Please verify network status.</p>
              </div>
            ) : bookingsList.length === 0 ? (
              <div className="glass-card p-16 rounded-3xl border border-slate-700 text-center space-y-3 text-slate-400">
                <Calendar className="w-12 h-12 text-slate-700 mx-auto" />
                <h3 className="font-bold text-slate-200">No Booking Requests Found</h3>
                <p className="text-xs font-light max-w-xs mx-auto leading-relaxed">
                  No active or pending reservations match your filters. Check history page for past completed stays.
                </p>
                <button type="button" onClick={handleResetFilters} className="btn-secondary py-2 px-4 text-xs mt-2">
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingsList.map((booking) => {
                  const config = STATUS_CONFIG[booking.status] || {};
                  const StatusIcon = config.icon || Calendar;
                  
                  const checkInStr = new Date(booking.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const checkOutStr = new Date(booking.checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

                  return (
                    <div 
                      key={booking.id} 
                      className="glass-card rounded-2xl p-5 border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700/80 transition-all duration-300 relative group overflow-hidden"
                    >
                      {/* Property Card info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700">
                          {booking.propertyImage ? (
                            <img src={booking.propertyImage} className="w-full h-full object-cover" alt="property" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6 text-slate-700" /></div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md font-semibold text-slate-400 uppercase">
                              {booking.bookingReference}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md font-extrabold ${config.badgeClass}`}>
                              <StatusIcon className="w-2.5 h-2.5" />
                              <span>{config.label}</span>
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-200 line-clamp-1">{booking.propertyTitle}</h4>
                          <p className="text-[11px] text-slate-400">
                            {checkInStr} — {checkOutStr}
                          </p>
                          <p className="text-[10px] text-slate-500 font-light">
                            {isLandlord ? `Request by: ${booking.tenantName}` : `Location: ${booking.propertyCity}, ${booking.propertyState}`}
                          </p>
                        </div>
                      </div>

                      {/* Pricing / Action operations */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-slate-700 gap-4">
                        <div className="text-left md:text-right">
                          <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block">Total Rent Cost</span>
                          <span className="text-base font-black text-white">₹{booking.totalAmount.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {isLandlord && booking.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(booking.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2 px-3 rounded-lg shadow-md transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(booking.id)}
                                className="bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 text-slate-400 border border-slate-700 text-[10px] font-bold py-2 px-3 rounded-lg transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {/* Tenant Pay Now Button — shown when booking is CONFIRMED and payment is UNPAID */}
                          {!isLandlord && booking.status === "CONFIRMED" && booking.paymentStatus !== "PAID" && (
                            <Link
                              to={`/dashboard/payments/pay/${booking.id}`}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[10px] font-bold py-2 px-3 rounded-lg shadow-md transition-all flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay Now
                            </Link>
                          )}

                          <Link 
                            to={`/dashboard/bookings/${booking.id}`}
                            className="btn-secondary py-2 px-3 text-[10px] font-bold flex items-center space-x-1 border-slate-850 hover:border-slate-700"
                          >
                            <span>Audit File</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. Pagination view controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-700 text-xs text-slate-400">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous Page
                </button>
                <span>Page {currentPage} of {pagination.totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={currentPage === pagination.totalPages}
                  className="btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next Page
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDashboard;
