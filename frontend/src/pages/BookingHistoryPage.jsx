// RentEase Booking History Page
// Displays past completed, cancelled, and rejected stays. Features sorting and searches.

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Search, 
  Filter, 
  ArrowLeft, 
  ArrowUpDown, 
  Home, 
  AlertCircle 
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useBookings } from "../hooks/useBookings.js";
import { STATUS_CONFIG } from "../constants/bookingStatusConfig.js";

const BookingHistoryPage = () => {
  const { user } = useAuth();
  
  // 1. Filter States
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Switch between COMPLETED, CANCELLED, REJECTED
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("checkIn");
  const [sortOrder, setSortOrder] = useState("desc");

  // Instantiating hooks coordinator
  const bookingsHook = useBookings();

  // 2. Fetch User Bookings (Historical search filters: COMPLETED, CANCELLED, REJECTED)
  // If statusFilter is empty, we fetch any history by excluding PENDING/CONFIRMED implicitly
  const queryStatus = statusFilter || "COMPLETED,CANCELLED,REJECTED";
  
  const { data: bookingsData, isLoading, isError } = bookingsHook.useUserBookings({
    page: String(currentPage),
    limit: "10", // 10 items per page
    status: queryStatus,
    search: searchQuery,
    sortBy,
    sortOrder
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === "checkin_asc") {
      setSortBy("checkIn");
      setSortOrder("asc");
    } else if (val === "checkout_desc") {
      setSortBy("checkOut");
      setSortOrder("desc");
    } else {
      setSortBy("checkIn");
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const isLandlord = user?.role === "LANDLORD";
  const bookingsList = bookingsData?.bookings || [];
  const pagination = bookingsData?.pagination || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-6 space-y-8 text-left">
        
        {/* Title Header */}
        <div className="space-y-4">
          <Link to="/dashboard/bookings" className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Active Dashboard</span>
          </Link>

          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Booking History</h1>
            <p className="text-sm text-slate-400 mt-1 font-light">
              Review and audit your past, completed, and cancelled stays
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="glass-card rounded-2xl p-4 border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative flex items-center">
            <Search className="w-4 h-4 text-slate-500 absolute left-4" />
            <input
              type="text"
              placeholder="Search by listing name or reference code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-200"
            />
          </form>

          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-900 border border-slate-700 pl-9 pr-3 py-3 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Past Stays</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Declined Requests</option>
            </select>
          </div>

          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
            <select
              onChange={handleSortChange}
              className="w-full bg-slate-900 border border-slate-700 pl-9 pr-3 py-3 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="checkin_desc">Check-in: Newest First</option>
              <option value="checkin_asc">Check-in: Oldest First</option>
              <option value="checkout_desc">Check-out: Newest First</option>
            </select>
          </div>

        </div>

        {/* Listings History lists */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-2xl h-24 border border-slate-700 animate-pulse"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="glass-card p-12 rounded-3xl border border-slate-700 text-center text-slate-400">
            <AlertCircle className="w-12 h-12 text-red-500/55 mx-auto mb-3" />
            <p>Failed to query booking logs. Please verify network status.</p>
          </div>
        ) : bookingsList.length === 0 ? (
          <div className="glass-card p-16 rounded-3xl border border-slate-700 text-center space-y-3 text-slate-400">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto" />
            <h3 className="font-bold text-slate-200">No Historical Records</h3>
            <p className="text-xs font-light max-w-xs mx-auto leading-relaxed">
              No completed, cancelled, or declined stay logs were found matching active filters.
            </p>
            <button type="button" onClick={handleResetFilters} className="btn-secondary py-2 px-4 text-xs mt-2">
              Clear Search Filters
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
                <Link 
                  key={booking.id} 
                  to={`/dashboard/bookings/${booking.id}`}
                  className="glass-card rounded-2xl p-4 border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700/80 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0">
                      {booking.propertyImage ? (
                        <img src={booking.propertyImage} className="w-full h-full object-cover" alt="property" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Home className="w-5 h-5 text-slate-700" /></div>
                      )}
                    </div>

                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded font-semibold text-slate-400">
                          {booking.bookingReference}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded font-extrabold ${config.badgeClass}`}>
                          <StatusIcon className="w-2 h-2" />
                          <span>{config.label}</span>
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-200 group-hover:text-brand-400 transition-colors line-clamp-1">{booking.propertyTitle}</h4>
                      <p className="text-[10px] text-slate-500">
                        {checkInStr} — {checkOutStr}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right self-stretch sm:self-center border-t sm:border-0 border-slate-700 pt-3 sm:pt-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                    <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider block sm:hidden">Total Amount</span>
                    <span className="text-sm font-black text-white">₹{booking.totalAmount.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-500 hidden sm:block">View Receipt</span>
                  </div>

                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
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
    </div>
  );
};

export default BookingHistoryPage;
