import React from "react";
import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({ message, isSelf }) {
  const { message: text, createdAt, isRead, isSending } = message;

  // Format message time (e.g. "4:32 PM")
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className={`flex flex-col w-full my-1 ${isSelf ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-200 border ${
          isSelf
            ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-indigo-600/10 shadow-lg"
            : "bg-slate-900 border-slate-700 text-slate-100 rounded-tl-none"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </div>

      <div className="flex items-center space-x-1.5 mt-1 px-1 select-none">
        <span className="text-[10px] text-slate-500 font-medium">{formatTime(createdAt)}</span>
        
        {isSelf && (
          <div className="flex items-center">
            {isSending ? (
              <span className="w-1.5 h-1.5 border border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : isRead ? (
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Check className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
