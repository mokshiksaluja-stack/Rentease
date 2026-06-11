import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function ConversationPage() {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useConversationMessages(conversationId);

  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkAsRead();

  // Socket chat synchronization hooks
  useSocketChatSync(user?.id, conversationId);

  // Auto-connect socket when messages page mounts
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && user?.id) {
      socketService.connect(token);
    }
  }, [user?.id]);

  // Connect to the active conversation socket room when selected
  useEffect(() => {
    if (conversationId) {
      socketService.joinRoom(conversationId);
      markReadMutation.mutate(conversationId);
    }

    return () => {
      if (conversationId) {
        socketService.leaveRoom(conversationId);
      }
    };
  }, [conversationId]);

  const activeConversation = conversations.find(c => c.id === conversationId);

  const handleBack = () => {
    // Navigate back to messages list page
    navigate("/dashboard/bookings?tab=messages");
  };

  const handleSendMessage = async (text) => {
    if (!activeConversation) return;

    const propertyId = activeConversation.propertyId;
    const receiverId = activeConversation.otherUser.id;

    await sendMessageMutation.mutateAsync({
      propertyId,
      receiverId,
      message: text,
      conversationId,
      currentUserId: user.id
    });
  };

  if (isLoadingConversations) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-950 text-slate-400">
        <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading conversation...</p>
      </div>
    );
  }

  if (!activeConversation && !isLoadingConversations) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-950 text-slate-400 text-center p-6">
        <p className="text-sm mb-4">Conversation not found or access denied.</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-slate-950">
      <ChatWindow
        activeConversation={activeConversation}
        messagesData={messagesData}
        onSendMessage={handleSendMessage}
        onBack={handleBack}
        currentUserId={user?.id}
        isSending={sendMessageMutation.isPending}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
