import React from "react";
import { NOTIFICATION_CONFIG } from "../../constants/notificationConfig.js";

export default function NotificationItem({ notification, onClick }) {
  const { id, type, title, body, isRead, createdAt } = notification;
  
  const config = NOTIFICATION_CONFIG[type] || {
    label: "Notification",
    color: "text-slate-400 border-slate-500/20 bg-slate-500/10",
    icon: null,
    route: "/dashboard/bookings"
  };

  const IconComponent = config.icon;

  // Format relative timestamp (e.g. "2 hours ago" or "Yesterday")
  const formatDistance = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <button
      onClick={() => onClick(notification)}
      className={`flex items-start space-x-3 w-full p-4 border rounded-2xl text-left transition-all duration-200 outline-none ${
        isRead
          ? "bg-slate-950/20 border-slate-700 hover:bg-slate-900/20"
          : "bg-slate-900/30 border-indigo-500/20 hover:bg-slate-900/50 shadow-md shadow-indigo-500/[0.02]"
      }`}
    >
      {/* Icon Frame */}
      {IconComponent && (
        <div className={`p-2 rounded-xl flex-shrink-0 border ${config.color}`}>
          <IconComponent className="w-4 h-4" />
        </div>
      )}

      {/* Info details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            {config.label}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {formatDistance(createdAt)}
          </span>
        </div>
        <h5 className={`text-xs truncate ${isRead ? "text-slate-300 font-medium" : "text-slate-100 font-semibold"}`}>
          {title}
        </h5>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
          {body}
        </p>
      </div>

      {/* Unread Glow Dot */}
      {!isRead && (
        <div className="flex-shrink-0 mt-2 select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
          </span>
        </div>
      )}
    </button>
  );
}
