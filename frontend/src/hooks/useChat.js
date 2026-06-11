import { useEffect } from "react";
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api.js";
import { socketService } from "../services/socket.service.js";

/**
 * Fetch all conversations for the user
 */
export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await api.get("/chat/conversations");
      return response.data?.data || [];
    }
  });
};

/**
 * Fetch messages in a conversation (Infinite Query)
 */
export const useConversationMessages = (conversationId) => {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/chat/messages/${conversationId}`, {
        params: { page: pageParam, limit: 20 }
      });
      return response.data?.data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last loaded page has 20 items, there might be more
      return lastPage.length === 20 ? allPages.length + 1 : undefined;
    },
    enabled: !!conversationId,
    initialPageParam: 1
  });
};

/**
 * Send a message mutation
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, receiverId, message }) => {
      const response = await api.post("/chat/message", { propertyId, receiverId, message });
      return response.data?.data;
    },
    // Optimistic Update
    onMutate: async ({ receiverId, message, tempId, conversationId, currentUserId }) => {
      // Cancel refetch queries
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      await queryClient.cancelQueries({ queryKey: ["conversations"] });

      // Save previous messages snapshot
      const previousMessages = queryClient.getQueryData(["messages", conversationId]);

      // Optimistically append the message
      const optimisticMessage = {
        id: tempId || `temp-${Date.now()}`,
        conversationId,
        senderId: currentUserId,
        receiverId,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
        isSending: true
      };

      queryClient.setQueryData(["messages", conversationId], (old) => {
        if (!old) return { pages: [[optimisticMessage]], pageParams: [1] };
        
        const newPages = [...old.pages];
        newPages[0] = [optimisticMessage, ...newPages[0]];
        return {
          ...old,
          pages: newPages
        };
      });

      // Optimistically update conversation list lastMessage
      queryClient.setQueryData(["conversations"], (oldConvList = []) => {
        return oldConvList.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              updatedAt: new Date().toISOString(),
              lastMessage: optimisticMessage
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });

      return { previousMessages, conversationId };
    },
    // On Failure: Rollback optimistic updates
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", context.conversationId], context.previousMessages);
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    // On Success: replace optimistic message with real message
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(["messages", context.conversationId], (old) => {
        if (!old) return { pages: [[data]], pageParams: [1] };
        
        const newPages = old.pages.map((page) => {
          return page.map((msg) => (msg.isSending ? data : msg));
        });
        return {
          ...old,
          pages: newPages
        };
      });

      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
};

/**
 * Mark a conversation as read mutation
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId) => {
      const response = await api.patch(`/chat/read/${conversationId}`);
      return response.data;
    },
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: ["conversations"] });

      queryClient.setQueryData(["conversations"], (oldConvList = []) => {
        return oldConvList.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              unreadCount: 0
            };
          }
          return conv;
        });
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
};

/**
 * Synchronizes Socket.io events with the React Query cache
 */
export const useSocketChatSync = (currentUserId, activeConversationId = null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUserId) return;

    // Listen for incoming messages
    const handleMessageReceive = (message) => {
      const { conversationId, senderId } = message;

      // 1. If we are currently viewing this thread, append it to query messages cache
      queryClient.setQueryData(["messages", conversationId], (old) => {
        if (!old) return undefined;
        // Avoid duplicates if message is already optimistically sent/stored
        const exists = old.pages.some(page => page.some(m => m.id === message.id));
        if (exists) return old;

        const newPages = [...old.pages];
        newPages[0] = [message, ...newPages[0]];
        return {
          ...old,
          pages: newPages
        };
      });

      // 2. Mark as read immediately on socket if we are viewing the active thread
      if (activeConversationId === conversationId && senderId !== currentUserId) {
        socketService.emit("message:read", { conversationId, readerId: currentUserId });
        api.patch(`/chat/read/${conversationId}`).catch(() => {});
      }

      // 3. Update the conversation list card preview and unread counters
      queryClient.setQueryData(["conversations"], (oldConvList = []) => {
        // If conversation doesn't exist, invalidate to trigger reload
        const exists = oldConvList.some(c => c.id === conversationId);
        if (!exists) {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          return oldConvList;
        }

        return oldConvList.map((conv) => {
          if (conv.id === conversationId) {
            const isUnread = senderId !== currentUserId && activeConversationId !== conversationId;
            return {
              ...conv,
              updatedAt: message.createdAt,
              lastMessage: message,
              unreadCount: isUnread ? conv.unreadCount + 1 : conv.unreadCount
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    // Listen for read receipts
    const handleMessageRead = ({ conversationId, readerId }) => {
      if (readerId !== currentUserId) {
        // Update read receipt status on thread messages cache
        queryClient.setQueryData(["messages", conversationId], (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map(page => page.map(msg => {
              if (msg.senderId === currentUserId) {
                return { ...msg, isRead: true };
              }
              return msg;
            }))
          };
        });

        // Update read status on conversation list cache
        queryClient.setQueryData(["conversations"], (oldConvList = []) => {
          return oldConvList.map((conv) => {
            if (conv.id === conversationId && conv.lastMessage && conv.lastMessage.senderId === currentUserId) {
              return {
                ...conv,
                lastMessage: { ...conv.lastMessage, isRead: true }
              };
            }
            return conv;
          });
        });
      }
    };

    // User Presence tracking
    const handleUserOnline = ({ userId }) => {
      queryClient.setQueryData(["conversations"], (oldConvList = []) => {
        return oldConvList.map((conv) => {
          if (conv.tenant?.id === userId) {
            return { ...conv, tenant: { ...conv.tenant, isOnline: true } };
          }
          if (conv.landlord?.id === userId) {
            return { ...conv, landlord: { ...conv.landlord, isOnline: true } };
          }
          return conv;
        });
      });
    };

    const handleUserOffline = ({ userId }) => {
      queryClient.setQueryData(["conversations"], (oldConvList = []) => {
        return oldConvList.map((conv) => {
          if (conv.tenant?.id === userId) {
            return { ...conv, tenant: { ...conv.tenant, isOnline: false, lastSeen: new Date().toISOString() } };
          }
          if (conv.landlord?.id === userId) {
            return { ...conv, landlord: { ...conv.landlord, isOnline: false, lastSeen: new Date().toISOString() } };
          }
          return conv;
        });
      });
    };

    // Register listeners
    socketService.on("message:receive", handleMessageReceive);
    socketService.on("message:read", handleMessageRead);
    socketService.on("user:online", handleUserOnline);
    socketService.on("user:offline", handleUserOffline);

    return () => {
      socketService.off("message:receive", handleMessageReceive);
      socketService.off("message:read", handleMessageRead);
      socketService.off("user:online", handleUserOnline);
      socketService.off("user:offline", handleUserOffline);
    };
  }, [currentUserId, activeConversationId, queryClient]);
};
