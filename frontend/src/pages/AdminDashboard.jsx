// RentEase Admin Dashboard
// Platform-wide analytics: revenue, user growth, booking trends, quick metrics.

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Home, DollarSign, Calendar, TrendingUp, TrendingDown,
  BarChart3, AlertTriangle, UserCheck, UserX, CheckCircle2, Flag
} from "lucide-react";
import { useAdmin } from "../hooks/useAdmin.js";

const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between"
  >
    <div className="space-y-1.5">
      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">{label}</span>
      <h3 className={`text-2xl font-black ${color || "text-white"}`}>{value}</h3>
      {sub && <p className="text-xs text-slate-500 font-light">{sub}</p>}
    </div>
    <div className={`p-3.5 rounded-xl border ${
      color?.includes("emerald") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
      color?.includes("indigo") ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500" :
      color?.includes("amber") ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
      color?.includes("rose") ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
      color?.includes("blue") ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
      "bg-slate-800 border-slate-700 text-slate-400"
    }`}>
      <Icon className="w-6 h-6" />
    </div>
  </motion.div>
);

const MiniBarChart = ({ data = [], valueKey = "count", color = "bg-indigo-500", label }) => {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          {label}
        </h3>
      </div>
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="text-[10px] text-slate-500 font-mono w-14 text-right shrink-0">{d.month}</div>
            <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full ${color} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(((d[valueKey] || 0) / max) * 100)}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold w-12 text-right shrink-0">
              {typeof d[valueKey] === "number" && valueKey === "revenue"
                ? `$${Number(d[valueKey]).toLocaleString()}`
                : d[valueKey] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GrowthBadge = ({ pct }) => {
  const positive = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
      positive ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
    }`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(pct)}%
    </span>
  );
};

const AdminDashboard = () => {
  const { useAdminDashboard } = useAdmin();
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-28 border border-slate-700 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-48 border border-slate-700 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1 font-light">Real-time platform health and analytics</p>
      </div>

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${Number(data.totalRevenue || 0).toLocaleString()}`}
          sub={`$${Number(data.monthlyRevenue || 0).toLocaleString()} this month`}
          color="text-emerald-400"
          delay={0}
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={data.totalUsers || 0}
          sub={`${data.totalTenants} tenants · ${data.totalLandlords} landlords`}
          color="text-indigo-400"
          delay={0.05}
        />
        <StatCard
          icon={Home}
          label="Total Properties"
          value={data.totalProperties || 0}
          sub={`${data.activeProperties} available · ${data.approvedProperties} approved`}
          color="text-blue-400"
          delay={0.1}
        />
        <StatCard
          icon={Calendar}
          label="Total Bookings"
          value={data.totalBookings || 0}
          sub={`${data.confirmedBookings} confirmed · ${data.completedBookings} completed`}
          color="text-amber-400"
          delay={0.15}
        />
      </div>

      {/* Secondary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={UserX} label="Suspended Users" value={data.suspendedUsers || 0} color="text-rose-400" delay={0.2} />
        <StatCard icon={Flag} label="Open Reports" value={data.openReports || 0} color="text-amber-400" delay={0.25} />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">User Growth</span>
            <h3 className="text-2xl font-black text-slate-100 mt-1.5">{data.userGrowthPct >= 0 ? "+" : ""}{data.userGrowthPct}%</h3>
            <p className="text-xs text-slate-500 mt-0.5">vs last month</p>
          </div>
          <GrowthBadge pct={data.userGrowthPct} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="glass-card rounded-2xl p-6 border border-slate-700 flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Booking Growth</span>
            <h3 className="text-2xl font-black text-slate-100 mt-1.5">{data.bookingGrowthPct >= 0 ? "+" : ""}{data.bookingGrowthPct}%</h3>
            <p className="text-xs text-slate-500 mt-0.5">vs last month</p>
          </div>
          <GrowthBadge pct={data.bookingGrowthPct} />
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <MiniBarChart
            data={data.monthlyRevenueTrend || []}
            valueKey="revenue"
            color="bg-gradient-to-r from-emerald-600 to-teal-500"
            label="Revenue (6 Months)"
          />
        </div>
        <div className="lg:col-span-1">
          <MiniBarChart
            data={data.userGrowth || []}
            valueKey="count"
            color="bg-indigo-500"
            label="New Users (6 Months)"
          />
        </div>
        <div className="lg:col-span-1">
          <MiniBarChart
            data={data.bookingGrowth || []}
            valueKey="count"
            color="bg-amber-500"
            label="New Bookings (6 Months)"
          />
        </div>
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { to: "/admin/users", icon: Users, label: "Manage Users", sub: `${data.totalUsers} registered`, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40" },
          { to: "/admin/properties", icon: Home, label: "Moderate Properties", sub: `${data.totalProperties} listed`, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40" },
          { to: "/admin/reports", icon: Flag, label: "Review Reports", sub: `${data.openReports} open`, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40" }
        ].map(({ to, icon: Icon, label, sub, color, bg }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-4 rounded-2xl p-5 border transition-all duration-200 ${bg}`}
          >
            <div className={`p-3 rounded-xl bg-slate-800 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className={`font-bold text-sm ${color}`}>{label}</div>
              <div className="text-slate-500 text-xs mt-0.5">{sub}</div>
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
