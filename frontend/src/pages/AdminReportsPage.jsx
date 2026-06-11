// RentEase Admin Reports Page
// View, filter, and resolve user-submitted reports about properties or users.

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Flag, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Calendar, User, Home, AlertTriangle, Clock
} from "lucide-react";
import { useAdmin } from "../hooks/useAdmin.js";

const REASON_CONFIG = {
  FAKE_LISTING: { label: "Fake Listing", cls: "bg-rose-500/15 text-rose-400 border-rose-500/20" },
  SCAM: { label: "Scam", cls: "bg-red-600/15 text-red-400 border-red-500/20" },
  INAPPROPRIATE_CONTENT: { label: "Inappropriate", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  DUPLICATE_LISTING: { label: "Duplicate", cls: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  OTHER: { label: "Other", cls: "bg-slate-700/50 text-slate-400 border-slate-600/30" }
};

const STATUS_CONFIG = {
  OPEN: { label: "Open", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: AlertTriangle },
  REVIEWING: { label: "Reviewing", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  RESOLVED: { label: "Resolved", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  DISMISSED: { label: "Dismissed", cls: "bg-slate-700/30 text-slate-500 border-slate-700/30", icon: XCircle }
};

const STATUS_TABS = ["", "OPEN", "REVIEWING", "RESOLVED", "DISMISSED"];

const AdminReportsPage = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");

  const { useAdminReports, useResolveReport } = useAdmin();

  const { data, isLoading } = useAdminReports({
    page,
    limit: 12,
    status: statusFilter,
    targetType: targetTypeFilter
  });

  const reports = data?.reports || [];
  const pagination = data?.pagination || {};

  const resolveMutation = useResolveReport();

  const handleResolve = (reportId) => {
    resolveMutation.mutate({ reportId, status: "RESOLVED" });
  };

  const handleDismiss = (reportId) => {
    resolveMutation.mutate({ reportId, status: "DISMISSED" });
  };

  const handleReviewing = (reportId) => {
    resolveMutation.mutate({ reportId, status: "REVIEWING" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
          <Flag className="w-6 h-6 text-amber-400" />
          Reports Queue
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Review and resolve user-submitted reports</p>
      </div>

      {/* Filter tabs */}
      <div className="glass-card rounded-2xl p-4 border border-slate-700 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? s === "OPEN" ? "bg-rose-600 border-rose-500 text-white" :
                    s === "REVIEWING" ? "bg-amber-600 border-amber-500 text-white" :
                    s === "RESOLVED" ? "bg-emerald-600 border-emerald-500 text-white" :
                    s === "DISMISSED" ? "bg-slate-700 border-slate-600 text-white" :
                    "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-700"
              }`}
            >
              {s || "All Status"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          {["", "PROPERTY", "USER"].map(t => (
            <button
              key={t}
              onClick={() => { setTargetTypeFilter(t); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
                targetTypeFilter === t ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-700"
              }`}
            >
              {t === "PROPERTY" ? <Home className="w-3 h-3" /> : t === "USER" ? <User className="w-3 h-3" /> : null}
              {t || "All Types"}
            </button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-28 border border-slate-700 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 border border-slate-700 text-center">
          <Flag className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No reports match the current filters</p>
          {statusFilter === "OPEN" && (
            <p className="text-slate-600 text-xs mt-1">🎉 All reports are resolved</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, i) => {
            const reasonCfg = REASON_CONFIG[report.reason] || REASON_CONFIG.OTHER;
            const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.OPEN;
            const StatusIcon = statusCfg.icon;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl border border-slate-700 p-5 flex flex-col md:flex-row gap-4 items-start md:items-center"
              >
                {/* Left — Reporter + type */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600/30 to-rose-600/30 border border-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-sm overflow-hidden">
                    {report.reporter?.avatar
                      ? <img src={report.reporter.avatar} className="w-full h-full object-cover" alt="" />
                      : report.reporter?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{report.reporter?.name || "Unknown"}</div>
                    <div className="text-slate-500 text-xs">{report.reporter?.email}</div>
                  </div>
                </div>

                {/* Center — Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${reasonCfg.cls}`}>
                      {reasonCfg.label}
                    </span>
                    <span className="text-[9px] text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full font-mono uppercase">
                      {report.targetType}
                    </span>
                    <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border font-bold ${statusCfg.cls}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusCfg.label}
                    </span>
                  </div>

                  {report.description && (
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{report.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="font-mono truncate text-slate-700">Target: {report.targetId.slice(0, 12)}...</span>
                  </div>
                </div>

                {/* Right — Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {report.status === "OPEN" && (
                    <button
                      onClick={() => handleReviewing(report.id)}
                      disabled={resolveMutation.isPending}
                      className="text-[10px] font-bold py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-600 hover:text-white disabled:opacity-50 transition flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Review
                    </button>
                  )}
                  {(report.status === "OPEN" || report.status === "REVIEWING") && (
                    <>
                      <button
                        onClick={() => handleResolve(report.id)}
                        disabled={resolveMutation.isPending}
                        className="text-[10px] font-bold py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-50 transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                      <button
                        onClick={() => handleDismiss(report.id)}
                        disabled={resolveMutation.isPending}
                        className="text-[10px] font-bold py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Dismiss
                      </button>
                    </>
                  )}
                  {(report.status === "RESOLVED" || report.status === "DISMISSED") && (
                    <span className="text-[10px] text-slate-600 italic">
                      {report.resolvedAt ? new Date(report.resolvedAt).toLocaleDateString() : "Closed"}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>{pagination.totalItems} reports total</span>
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
    </div>
  );
};

export default AdminReportsPage;
