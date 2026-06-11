import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ConversationList from "../components/chat/ConversationList.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { socketService } from "../services/socket.service.js";
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkAsRead,
  useSocketChatSync
} from "../hooks/useChat.js";

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConversationId = searchParams.get("id") || null;

  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useConversationMessages(activeConversationId);

  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkAsRead();

  // Socket chat synchronization hooks
  useSocketChatSync(user?.id, activeConversationId);

  // Auto-connect socket when messages page mounts
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && user?.id) {
      socketService.connect(token);
    }
  }, [user?.id]);

  // Connect to the active conversation socket room when selected
  useEffect(() => {
    if (activeConversationId) {
      socketService.joinRoom(activeConversationId);
      markReadMutation.mutate(activeConversationId);
    }

    return () => {
      if (activeConversationId) {
        socketService.leaveRoom(activeConversationId);
      }
    };
  }, [activeConversationId]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const handleSelectConversation = (id) => {
    setSearchParams({ tab: "messages", id });
  };

  const handleBackToList = () => {
    setSearchParams({ tab: "messages" });
  };

  const handleSendMessage = async (text) => {
    if (!activeConversation) return;

    const propertyId = activeConversation.propertyId;
    const receiverId = activeConversation.otherUser.id;

    await sendMessageMutation.mutateAsync({
      propertyId,
      receiverId,
      message: text,
      conversationId: activeConversationId,
      currentUserId: user.id
    });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden max-w-7xl mx-auto rounded-3xl border border-slate-700 shadow-2xl bg-slate-950/40">
      {/* Sidebar Conversation List */}
      <div className={`w-full md:w-80 flex-shrink-0 ${activeConversationId ? "hidden md:block" : "block"}`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          currentUserId={user?.id}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Messaging Panel */}
      <div className={`flex-1 h-full ${!activeConversationId ? "hidden md:block" : "block"}`}>
        <ChatWindow
          activeConversation={activeConversation}
          messagesData={messagesData}
          onSendMessage={handleSendMessage}
          onBack={handleBackToList}
          currentUserId={user?.id}
          isSending={sendMessageMutation.isPending}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      </div>
    </div>
  );
}
