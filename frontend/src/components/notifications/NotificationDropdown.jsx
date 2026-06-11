import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckSquare, BellOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead
} from "../../hooks/useNotifications.js";
import NotificationItem from "./NotificationItem.jsx";

export default function NotificationDropdown({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { data, isLoading } = useNotifications({ page: 1, limit: 5 });
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    // 1. Mark as read immediately
    if (!notif.isRead) {
      await markReadMutation.mutateAsync(notif.id);
    }
    setIsOpen(false);

    // 2. Resolve deep-linking redirect
    if (notif.type === "MESSAGE_RECEIVED" && notif.metadata?.conversationId) {
      navigate(`/dashboard/bookings?tab=messages&id=${notif.metadata.conversationId}`);
    } else if (notif.type.startsWith("BOOKING")) {
      navigate(`/dashboard/bookings?tab=bookings`);
    } else {
      navigate(`/dashboard/bookings`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllReadMutation.mutateAsync();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all duration-200 outline-none focus:outline-none ${
          isOpen
            ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
            : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-700"
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Glow count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-bold text-white items-center justify-center select-none shadow-md shadow-rose-600/20">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-80 md:w-96 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-950/80 backdrop-blur-md">
              <h4 className="text-sm font-bold text-slate-100">Notifications</h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  className="flex items-center space-x-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-all select-none"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notifications thread items */}
            <div className="max-h-80 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex items-center space-x-3 w-full p-3.5 rounded-xl border border-slate-700 bg-slate-900/10 animate-pulse">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-1/3 h-2 bg-slate-800 rounded" />
                      <div className="w-3/4 h-2.5 bg-slate-800 rounded" />
                    </div>
                  </div>
                ))
              ) : notifications.length > 0 ? (
                notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onClick={handleNotificationClick}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center select-none opacity-50">
                  <BellOff className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">All caught up!</p>
                </div>
              )}
            </div>

            {/* Footer View All link */}
            <div className="p-3 border-t border-slate-700 bg-slate-950 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/dashboard/bookings?tab=notifications");
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all block w-full py-1.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-700 active:scale-98"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
