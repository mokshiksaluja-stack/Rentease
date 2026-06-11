import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api.js";
import { socketService } from "../services/socket.service.js";

/**
 * Fetch all notifications for the user
 */
export const useNotifications = (queryParams = {}) => {
  return useQuery({
    queryKey: ["notifications", queryParams],
    queryFn: async () => {
      const response = await api.get("/notifications", { params: queryParams });
      return response.data?.data || { notifications: [], unreadCount: 0 };
    }
  });
};

/**
 * Mark a single notification as read mutation
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data?.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Optimistic update of read status and unreadCount
      queryClient.setQueriesData({ queryKey: ["notifications"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((notif) => 
            notif.id === id ? { ...notif, isRead: true } : notif
          ),
          unreadCount: Math.max(0, old.unreadCount - 1)
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};

/**
 * Mark all notifications as read mutation
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch("/notifications/read-all");
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      queryClient.setQueriesData({ queryKey: ["notifications"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((notif) => ({ ...notif, isRead: true })),
          unreadCount: 0
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};

/**
 * Register FCM token with server
 */
export const useRegisterDeviceToken = () => {
  return useMutation({
    mutationFn: async (token) => {
      const response = await api.post("/notifications/device-token", { token });
      return response.data;
    }
  });
};

/**
 * Setup real-time notifications synchronization with Socket.io client
 */
export const useSocketNotificationSync = (userId) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const handleNotificationReceive = (notification) => {
      console.log("🔔 [Socket Sync]: Notification received:", notification.title);

      // Refresh notifications query cache
      queryClient.setQueriesData({ queryKey: ["notifications"] }, (old) => {
        if (!old) return { notifications: [notification], unreadCount: 1 };
        
        // Avoid duplication
        const exists = old.notifications.some(n => n.id === notification.id);
        if (exists) return old;

        return {
          ...old,
          notifications: [notification, ...old.notifications],
          unreadCount: old.unreadCount + 1
        };
      });

      // Play a subtle notification sound or alert in-app if desired
    };

    socketService.on("notification:receive", handleNotificationReceive);

    return () => {
      socketService.off("notification:receive", handleNotificationReceive);
    };
  }, [userId, queryClient]);
};
