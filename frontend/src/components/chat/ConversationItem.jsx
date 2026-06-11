import React from "react";
import OnlineStatusBadge from "./OnlineStatusBadge.jsx";
import { Check, CheckCheck } from "lucide-react";

export default function ConversationItem({ conversation, isActive, onClick, currentUserId }) {
  const { property, otherUser, lastMessage, unreadCount, updatedAt } = conversation;

  // Format date or time
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 w-full p-4.5 rounded-2xl border transition-all duration-200 text-left outline-none ${
        isActive
          ? "bg-indigo-600/10 border-indigo-500/30 shadow-indigo-500/5 shadow-md"
          : "bg-slate-950/40 border-slate-700 hover:bg-slate-900/40 hover:border-slate-700"
      }`}
    >
      {/* Avatar Container */}
      <div className="relative flex-shrink-0">
        {otherUser?.avatar ? (
          <img
            src={otherUser.avatar}
            alt={otherUser.name}
            className="w-11 h-11 rounded-full object-cover border border-slate-700"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            {getInitials(otherUser?.name)}
          </div>
        )}
        
        {/* Presence Indicator */}
        <OnlineStatusBadge
          isOnline={otherUser?.isOnline}
          className="absolute bottom-0 right-0 border-2 border-slate-950 rounded-full"
        />
      </div>

      {/* Details info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h4 className="text-sm font-semibold text-slate-100 truncate pr-2">
            {otherUser?.name || "User"}
          </h4>
          <span className="text-[10px] text-slate-500 font-medium">
            {formatTime(updatedAt)}
          </span>
        </div>

        {/* Property name subtitle */}
        <p className="text-[10px] text-slate-400 truncate mb-1.5 font-medium">
          {property?.title || "Property Listing"}
        </p>

        {/* Message preview */}
        <div className="flex items-center space-x-1.5 min-w-0">
          {lastMessage && lastMessage.senderId === currentUserId && (
            <div className="flex-shrink-0">
              {lastMessage.isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Check className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
          )}
          
          <p className={`text-xs truncate flex-1 ${unreadCount > 0 ? "text-slate-200 font-semibold" : "text-slate-500"}`}>
            {lastMessage ? lastMessage.message : "No messages yet"}
          </p>

          {/* Unread Counter Badge */}
          {unreadCount > 0 && (
            <span className="flex-shrink-0 flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-indigo-600 min-w-5 h-5 shadow-indigo-600/30 shadow-md">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
