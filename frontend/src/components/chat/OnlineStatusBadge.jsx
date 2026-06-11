import React from "react";

export default function OnlineStatusBadge({ isOnline, className = "" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {isOnline ? (
        <>
          {/* Glowing pulse ring */}
          <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </>
      ) : (
        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500" />
      )}
    </div>
  );
}
