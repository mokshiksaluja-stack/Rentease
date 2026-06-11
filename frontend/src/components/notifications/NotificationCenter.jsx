import React from "react";
import { CheckSquare, BellOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead
} from "../../hooks/useNotifications.js";
import NotificationItem from "./NotificationItem.jsx";

export default function NotificationCenter({ userId }) {
  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useNotifications({ page: 1, limit: 50 });
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markReadMutation.mutateAsync(notif.id);
    }
    
    // Resolve deep linking
    if (notif.type === "MESSAGE_RECEIVED" && notif.metadata?.conversationId) {
      navigate(`/dashboard/bookings?tab=messages&id=${notif.metadata.conversationId}`);
    } else if (notif.type.startsWith("BOOKING")) {
      navigate(`/dashboard/bookings?tab=bookings`);
    } else {
      navigate(`/dashboard/bookings`);
    }
  };

  // Group notifications by date: Today, Yesterday, Earlier
  const groupNotifications = (list) => {
    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = new Date();
    const todayString = now.toDateString();
    
    const yestDate = new Date();
    yestDate.setDate(now.getDate() - 1);
    const yestString = yestDate.toDateString();

    list.forEach((notif) => {
      const date = new Date(notif.createdAt);
      const dateString = date.toDateString();

      if (dateString === todayString) {
        today.push(notif);
      } else if (dateString === yestString) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = groupNotifications(notifications);

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3 mb-6">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{title}</h4>
        <div className="space-y-2">
          {items.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onClick={handleNotificationClick}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center bg-slate-950 border border-slate-700 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-100">Notification Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
              : "You are all caught up!"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || isFetching}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20 text-xs font-semibold disabled:opacity-50 transition-all select-none active:scale-98"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Main notifications container list */}
      <div className="glass-card p-6 rounded-2xl border border-slate-700 min-h-[400px] flex flex-col justify-between">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Fetching notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="flex-1">
            {renderGroup("Today", today)}
            {renderGroup("Yesterday", yesterday)}
            {renderGroup("Earlier", earlier)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center select-none opacity-60 flex-1">
            <BellOff className="w-12 h-12 text-slate-700 mb-3" />
            <h3 className="text-sm font-bold text-slate-400 mb-1">No notifications found</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Updates regarding booking requests, chat messages, or rental agreements will show up here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
