// RentEase Admin Layout — Sidebar nav with active link highlighting

import React from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Home, Flag, ArrowLeft, LogOut, ShieldCheck
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

const NAV_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "User Management", icon: Users, end: false },
  { to: "/admin/properties", label: "Properties", icon: Home, end: false },
  { to: "/admin/reports", label: "Reports Queue", icon: Flag, end: false }
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Admin Left Sidebar */}
      <aside className="w-64 border-r border-slate-700 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-100 rounded-lg border border-brand-200">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
            </div>
            <span className="font-extrabold text-base text-slate-100">
              RentEase Admin
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-grow p-4 space-y-1">
          {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-50 text-brand-700 border border-brand-200"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent"
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px] flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span>Main Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-700 flex items-center justify-between px-8 bg-slate-900 flex-shrink-0 shadow-sm">
          <h1 className="font-semibold text-base text-slate-200">Admin Control Panel</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center font-bold text-sm text-white shadow-sm overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                user?.name?.[0]?.toUpperCase() || "A"
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">{user?.name || "Administrator"}</div>
              <div className="text-[10px] text-slate-500">{user?.email}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
