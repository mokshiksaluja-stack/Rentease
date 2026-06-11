import React, { useRef, useEffect, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import ChatInput from "./ChatInput.jsx";
import OnlineStatusBadge from "./OnlineStatusBadge.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import { MessageSquare, ArrowLeft, Loader2 } from "lucide-react";
import { socketService } from "../../services/socket.service.js";

export default function ChatWindow({
  activeConversation,
  messagesData,
  onSendMessage,
  onBack,
  currentUserId,
  isSending,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  // Flatten the React Query infinite scroll pages
  const messages = messagesData?.pages ? messagesData.pages.flatMap((page) => page) : [];

  // Scroll to bottom on initialization or when a new message is received
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Socket typing listeners binding
  useEffect(() => {
    if (!activeConversation?.id) return;

    const handleTypingStart = ({ conversationId }) => {
      if (conversationId === activeConversation.id) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = ({ conversationId }) => {
      if (conversationId === activeConversation.id) {
        setIsTyping(false);
      }
    };

    socketService.on("typing:start", handleTypingStart);
    socketService.on("typing:stop", handleTypingStop);

    return () => {
      socketService.off("typing:start", handleTypingStart);
      socketService.off("typing:stop", handleTypingStop);
      setIsTyping(false);
    };
  }, [activeConversation?.id]);

  // Handle infinite scroll triggering when scrolling up
  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (!activeConversation) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-full bg-slate-950/60 text-center p-8 select-none select-none">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mb-4 text-indigo-500 shadow-indigo-500/10 shadow-lg">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-200 mb-1">Select a Conversation</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
          Choose a conversation from the sidebar to view details and start chatting with property landlords or tenants.
        </p>
      </div>
    );
  }

  const { property, otherUser } = activeConversation;

  return (
    <div className="flex flex-col h-full bg-slate-950/80">
      {/* Thread Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center space-x-3 min-w-0">
          {/* Back button for mobile viewports */}
          <button
            onClick={onBack}
            className="md:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* User Status Details */}
          <div className="relative flex-shrink-0">
            {otherUser?.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                {otherUser?.name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
            )}
            <OnlineStatusBadge
              isOnline={otherUser?.isOnline}
              className="absolute bottom-0 right-0 border-2 border-slate-950 rounded-full"
            />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-100 truncate">
              {otherUser?.name || "User"}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium truncate block">
              {property?.title || "Property"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Scroll thread area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse custom-scrollbar"
      >
        <div ref={messagesEndRef} />
        
        {/* Render Typing state bubble inside scrolling area */}
        {isTyping && <TypingIndicator username={otherUser?.name} />}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isSelf={msg.senderId === currentUserId}
          />
        ))}

        {/* Fetching page loaders */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2 select-none">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Chat bottom input section */}
      <div className="p-4 border-t border-slate-700 bg-slate-950/90 backdrop-blur-md">
        <ChatInput
          onSendMessage={onSendMessage}
          conversationId={activeConversation.id}
          receiverId={otherUser?.id}
          isSending={isSending}
        />
      </div>
    </div>
  );
}
