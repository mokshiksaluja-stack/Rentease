// RentEase Admin Properties Moderation Page
// Approve, reject (with note), filter, and paginate all platform property listings.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Search, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  MapPin, User, Bed, Bath, DollarSign, AlertTriangle, X
} from "lucide-react";
import { useAdmin } from "../hooks/useAdmin.js";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Approved", value: "true" },
  { label: "Rejected", value: "false" }
];

const RejectModal = ({ property, onConfirm, onCancel, isPending }) => {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-slate-100 font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Reject Property
          </h3>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-400 text-sm">
          You're about to reject <span className="text-white font-semibold">"{property?.title}"</span>. The landlord will be notified.
        </p>
        <div>
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Rejection Reason (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Images are missing, title is misleading..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm font-semibold transition">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-bold transition"
          >
            {isPending ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AdminPropertiesPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [approvedFilter, setApprovedFilter] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);

  const { useAdminProperties, useApproveProperty, useRejectProperty } = useAdmin();
  const { data, isLoading } = useAdminProperties({ page, limit: 12, isApproved: approvedFilter, search });

  const properties = data?.properties || [];
  const pagination = data?.pagination || {};

  const approveMutation = useApproveProperty();
  const rejectMutation = useRejectProperty();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleApprove = (propertyId) => {
    approveMutation.mutate(propertyId);
  };

  const handleRejectConfirm = (note) => {
    rejectMutation.mutate({ propertyId: rejectTarget.id, note }, {
      onSuccess: () => setRejectTarget(null)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
          <Home className="w-6 h-6 text-blue-400" />
          Property Moderation
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Review, approve, and reject property listings</p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 border border-slate-700 flex flex-col md:flex-row gap-3 items-center">
        <form onSubmit={handleSearchSubmit} className="flex-grow w-full relative flex items-center">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by title or address..."
            className="w-full bg-slate-900/50 border border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 placeholder-slate-600"
          />
        </form>
        <div className="flex gap-2 w-full md:w-auto">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setApprovedFilter(f.value); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                approvedFilter === f.value
                  ? f.value === "true" ? "bg-emerald-600 border-emerald-500 text-white" :
                    f.value === "false" ? "bg-rose-600 border-rose-500 text-white" :
                    "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-64 border border-slate-700 animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 border border-slate-700 text-center">
          <Home className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No properties match current filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((prop, i) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl border border-slate-700 overflow-hidden flex flex-col"
            >
              {/* Thumbnail */}
              <div className="h-36 bg-slate-900 relative overflow-hidden">
                {prop.thumbnail ? (
                  <img src={prop.thumbnail} alt={prop.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-8 h-8 text-slate-700" />
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-2.5 right-2.5">
                  {prop.isApproved ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur text-white font-bold">Approved</span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/80 backdrop-blur text-white font-bold">Rejected</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div>
                  <h3 className="text-slate-100 font-bold text-sm line-clamp-1">{prop.title}</h3>
                  <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {prop.city}, {prop.state}
                  </p>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${Number(prop.rent).toLocaleString()}/mo</span>
                  <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{prop.bedrooms}bd</span>
                  <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{prop.bathrooms}ba</span>
                </div>

                {/* Landlord */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold overflow-hidden">
                    {prop.landlord?.avatar ? <img src={prop.landlord.avatar} className="w-full h-full object-cover" alt="" /> : prop.landlord?.name?.[0]}
                  </div>
                  <span className="text-xs text-slate-400">{prop.landlord?.name}</span>
                  <span className="text-[10px] text-slate-600 ml-auto">{prop.bookingCount} bookings</span>
                </div>

                {/* Rejection note */}
                {!prop.isApproved && prop.rejectedNote && (
                  <div className="flex items-start gap-1.5 bg-rose-950/20 border border-rose-500/15 rounded-lg p-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-rose-300/70 text-[10px] leading-relaxed">{prop.rejectedNote}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-1">
                  <button
                    onClick={() => handleApprove(prop.id)}
                    disabled={approveMutation.isPending || prop.isApproved}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold bg-emerald-600/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {prop.isApproved ? "Approved" : "Approve"}
                  </button>
                  <button
                    onClick={() => setRejectTarget(prop)}
                    disabled={rejectMutation.isPending || !prop.isApproved}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {!prop.isApproved ? "Rejected" : "Reject"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>{pagination.totalItems} properties</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 hover:border-slate-700 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>{page} / {pagination.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 hover:border-slate-700 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            property={rejectTarget}
            onConfirm={handleRejectConfirm}
            onCancel={() => setRejectTarget(null)}
            isPending={rejectMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPropertiesPage;
