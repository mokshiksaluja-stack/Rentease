import React, { useState } from "react";
import ConversationItem from "./ConversationItem.jsx";
import { Search, MessageSquareX } from "lucide-react";

export default function ConversationList({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  currentUserId,
  isLoading
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations by user name or property title
  const filteredConversations = conversations.filter((conv) => {
    const userName = conv.otherUser?.name || "";
    const propTitle = conv.property?.title || "";
    return (
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      propTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-700">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-700 space-y-4">
        <h3 className="text-lg font-bold text-slate-100">Messages</h3>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-indigo-500/50 transition-all duration-200"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Conversations scroll area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {isLoading ? (
          // Render skeleton screens
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center space-x-3 w-full p-4 rounded-2xl border border-slate-700 bg-slate-900/10 animate-pulse">
              <div className="w-11 h-11 bg-slate-800 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="w-1/3 h-3 bg-slate-800 rounded" />
                  <div className="w-10 h-2 bg-slate-800 rounded" />
                </div>
                <div className="w-1/2 h-2.5 bg-slate-800 rounded" />
                <div className="w-3/4 h-2.5 bg-slate-800 rounded" />
              </div>
            </div>
          ))
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv.id)}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          // Empty State view
          <div className="flex flex-col items-center justify-center h-full text-center p-6 select-none opacity-60">
            <MessageSquareX className="w-10 h-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-400 mb-1">
              {searchQuery ? "No matching conversations" : "No messages yet"}
            </h4>
            <p className="text-xs text-slate-500 max-w-xs leading-normal">
              {searchQuery 
                ? "Try searching for another landlord name or property listing." 
                : "Initiate inquiries by clicking the message button on property details pages."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
