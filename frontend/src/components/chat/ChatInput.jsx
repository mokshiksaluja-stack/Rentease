import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { socketService } from "../../services/socket.service.js";

export default function ChatInput({ onSendMessage, conversationId, receiverId, isSending }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  // Clean up typing status when changing conversations
  useEffect(() => {
    setText("");
    stopTyping();
    return () => stopTyping();
  }, [conversationId]);

  const handleTyping = () => {
    if (!socketService.getSocket() || !conversationId || !receiverId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.emit("typing:start", { conversationId, receiverId });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isTypingRef.current && socketService.getSocket() && conversationId && receiverId) {
      isTypingRef.current = false;
      socketService.emit("typing:stop", { conversationId, receiverId });
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    onSendMessage(trimmed);
    setText("");
    stopTyping();
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (unless Shift key is held for inserting a newline)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-3 w-full bg-slate-900 border border-slate-700 rounded-2xl p-2 focus-within:border-indigo-500/50 transition-all duration-200">
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          handleTyping();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 bg-transparent border-0 outline-none text-slate-100 placeholder-slate-500 text-sm py-2 px-3 resize-none max-h-32 focus:ring-0 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!text.trim() || isSending}
        className="flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition-all duration-200 shadow-md shadow-indigo-600/20 active:scale-95"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
