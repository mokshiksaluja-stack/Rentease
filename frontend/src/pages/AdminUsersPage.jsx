// RentEase Admin Users Management Page
// Search, filter, view, suspend, and activate user accounts.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Filter, UserX, UserCheck, ShieldAlert,
  ChevronLeft, ChevronRight, Mail, Calendar, Home, BookOpen, X
} from "lucide-react";
import { useAdmin } from "../hooks/useAdmin.js";

const ROLE_CONFIG = {
  TENANT: { label: "Tenant", cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  LANDLORD: { label: "Landlord", cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20" },
  ADMIN: { label: "Admin", cls: "bg-purple-500/15 text-purple-400 border-purple-500/20" }
};

const UserDetailPanel = ({ user, onClose, onSuspend, onActivate, suspending, activating }) => {
  if (!user) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        className="fixed right-0 top-0 h-full w-80 bg-slate-950 border-l border-slate-700 z-50 overflow-y-auto p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-100 font-bold text-base">User Details</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center mb-6 gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} /> : user.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-white font-bold text-sm">{user.name}</div>
            <div className="text-slate-400 text-xs">{user.email}</div>
            <div className="mt-1.5">
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${ROLE_CONFIG[user.role]?.cls}`}>
                {ROLE_CONFIG[user.role]?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: BookOpen, label: "Bookings", value: user.bookingCount || 0 },
            { icon: Home, label: "Properties", value: user.propertyCount || 0 },
            { icon: UserCheck, label: "Reviews", value: user.reviewCount || 0 }
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-slate-900 rounded-xl p-3 text-center border border-slate-700">
              <Icon className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <div className="text-white font-bold text-base">{value}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Info rows */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Mail className="w-3.5 h-3.5 text-slate-600" />
            <span>{user.email}</span>
            {user.isEmailVerified && <span className="text-emerald-400 text-[9px] font-bold">✓ Verified</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${user.isOnline ? "bg-emerald-400" : "bg-slate-600"}`} />
            <span className="text-slate-400">{user.isOnline ? "Online now" : user.lastSeen ? `Last seen ${new Date(user.lastSeen).toLocaleDateString()}` : "Offline"}</span>
          </div>
        </div>

        {/* Actions */}
        {user.role !== "ADMIN" && (
          <div className="space-y-2">
            {user.isSuspended ? (
              <button
                onClick={() => onActivate(user.id)}
                disabled={activating}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition"
              >
                <UserCheck className="w-4 h-4" />
                {activating ? "Activating..." : "Activate Account"}
              </button>
            ) : (
              <button
                onClick={() => onSuspend(user.id)}
                disabled={suspending}
                className="w-full flex items-center justify-center gap-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white font-bold py-3 rounded-xl text-sm transition"
              >
                <UserX className="w-4 h-4" />
                {suspending ? "Suspending..." : "Suspend Account"}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [suspendedFilter, setSuspendedFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const { useAdminUsers, useSuspendUser, useActivateUser } = useAdmin();

  const { data, isLoading } = useAdminUsers({ page, limit: 15, search, role: roleFilter, isSuspended: suspendedFilter });
  const users = data?.users || [];
  const pagination = data?.pagination || {};

  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSuspend = (userId) => {
    suspendMutation.mutate(userId, {
      onSuccess: () => setSelectedUser(prev => prev?.id === userId ? { ...prev, isSuspended: true } : prev)
    });
  };

  const handleActivate = (userId) => {
    activateMutation.mutate(userId, {
      onSuccess: () => setSelectedUser(prev => prev?.id === userId ? { ...prev, isSuspended: false } : prev)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            User Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Search, suspend, and manage platform users</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-700 flex flex-col md:flex-row gap-3 items-center">
        <form onSubmit={handleSearchSubmit} className="flex-grow w-full relative flex items-center">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-slate-900/50 border border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 placeholder-slate-600"
          />
        </form>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["", "TENANT", "LANDLORD", "ADMIN"].map(r => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                roleFilter === r ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-700"
              }`}
            >
              {r || "All Roles"}
            </button>
          ))}
          <button
            onClick={() => { setSuspendedFilter(suspendedFilter === "true" ? "" : "true"); setPage(1); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
              suspendedFilter === "true" ? "bg-rose-600 border-rose-500 text-white" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-700"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Suspended
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-950/60">
                <th className="px-5 py-3.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">User</th>
                <th className="px-5 py-3.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Activity</th>
                <th className="px-5 py-3.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 bg-slate-900 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Users className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No users match the current filters</p>
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedUser(user)}
                    className="border-b border-slate-700/50 hover:bg-slate-900/30 cursor-pointer transition-colors group"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                          {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition">{user.name}</div>
                          <div className="text-[11px] text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-5 py-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${ROLE_CONFIG[user.role]?.cls}`}>
                        {ROLE_CONFIG[user.role]?.label}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      {user.isSuspended ? (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">Suspended</span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">Active</span>
                      )}
                    </td>
                    {/* Joined */}
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    {/* Activity */}
                    <td className="px-5 py-4">
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div>{user.bookingCount} bookings</div>
                        <div>{user.propertyCount} properties</div>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      {user.role !== "ADMIN" && (
                        user.isSuspended ? (
                          <button
                            onClick={() => handleActivate(user.id)}
                            disabled={activateMutation.isPending}
                            className="flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-lg bg-emerald-600/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-600 hover:text-white transition disabled:opacity-50"
                          >
                            <UserCheck className="w-3 h-3" />
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(user.id)}
                            disabled={suspendMutation.isPending}
                            className="flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white transition disabled:opacity-50"
                          >
                            <UserX className="w-3 h-3" />
                            Suspend
                          </button>
                        )
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-700 text-xs text-slate-400">
            <span>{pagination.totalItems} users total</span>
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

      {/* Detail Panel */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuspend={handleSuspend}
          onActivate={handleActivate}
          suspending={suspendMutation.isPending}
          activating={activateMutation.isPending}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
