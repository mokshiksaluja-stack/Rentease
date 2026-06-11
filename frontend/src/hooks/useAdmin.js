// RentEase Admin React Query Hook Layer
// Wraps all admin API endpoints with caching, mutations, and cache invalidation.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api.js";
import toast from "react-hot-toast";

export const useAdmin = () => {
  const queryClient = useQueryClient();

  // ─── Dashboard ────────────────────────────────────────────

  const useAdminDashboard = () => {
    return useQuery({
      queryKey: ["admin-dashboard"],
      queryFn: async () => {
        const res = await api.get("/admin/dashboard");
        return res.data?.data;
      },
      staleTime: 60 * 1000 // 1 minute — dashboard doesn't need real-time freshness
    });
  };

  // ─── Users ────────────────────────────────────────────────

  const useAdminUsers = (filters = {}) => {
    return useQuery({
      queryKey: ["admin-users", filters],
      queryFn: async () => {
        const res = await api.get("/admin/users", { params: filters });
        return res.data?.data;
      },
      placeholderData: (prev) => prev
    });
  };

  const useAdminUser = (id) => {
    return useQuery({
      queryKey: ["admin-user", id],
      queryFn: async () => {
        const res = await api.get(`/admin/users/${id}`);
        return res.data?.data;
      },
      enabled: !!id
    });
  };

  const useSuspendUser = () => {
    return useMutation({
      mutationFn: async (userId) => {
        const res = await api.patch(`/admin/users/${userId}/suspend`);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-users"]);
        queryClient.invalidateQueries(["admin-dashboard"]);
        toast.success("User suspended successfully");
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to suspend user");
      }
    });
  };

  const useActivateUser = () => {
    return useMutation({
      mutationFn: async (userId) => {
        const res = await api.patch(`/admin/users/${userId}/activate`);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-users"]);
        queryClient.invalidateQueries(["admin-dashboard"]);
        toast.success("User account activated");
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to activate user");
      }
    });
  };

  // ─── Properties ───────────────────────────────────────────

  const useAdminProperties = (filters = {}) => {
    return useQuery({
      queryKey: ["admin-properties", filters],
      queryFn: async () => {
        const res = await api.get("/admin/properties", { params: filters });
        return res.data?.data;
      },
      placeholderData: (prev) => prev
    });
  };

  const useApproveProperty = () => {
    return useMutation({
      mutationFn: async (propertyId) => {
        const res = await api.patch(`/admin/properties/${propertyId}/approve`);
        return res.data?.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-properties"]);
        queryClient.invalidateQueries(["admin-dashboard"]);
        toast.success("Property approved and listed");
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to approve property");
      }
    });
  };

  const useRejectProperty = () => {
    return useMutation({
      mutationFn: async ({ propertyId, note }) => {
        const res = await api.patch(`/admin/properties/${propertyId}/reject`, { note });
        return res.data?.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-properties"]);
        toast.success("Property rejected");
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to reject property");
      }
    });
  };

  // ─── Reports ──────────────────────────────────────────────

  const useAdminReports = (filters = {}) => {
    return useQuery({
      queryKey: ["admin-reports", filters],
      queryFn: async () => {
        const res = await api.get("/admin/reports", { params: filters });
        return res.data?.data;
      },
      placeholderData: (prev) => prev
    });
  };

  const useCreateReport = () => {
    return useMutation({
      mutationFn: async (payload) => {
        const res = await api.post("/admin/reports", payload);
        return res.data?.data;
      },
      onSuccess: () => {
        toast.success("Report submitted. Our team will review it shortly.");
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to submit report");
      }
    });
  };

  const useResolveReport = () => {
    return useMutation({
      mutationFn: async ({ reportId, status }) => {
        const res = await api.patch(`/admin/reports/${reportId}/resolve`, { status });
        return res.data?.data;
      },
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries(["admin-reports"]);
        queryClient.invalidateQueries(["admin-dashboard"]);
        toast.success(`Report marked as ${vars.status.toLowerCase()}`);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to update report");
      }
    });
  };

  return {
    useAdminDashboard,
    useAdminUsers,
    useAdminUser,
    useSuspendUser,
    useActivateUser,
    useAdminProperties,
    useApproveProperty,
    useRejectProperty,
    useAdminReports,
    useCreateReport,
    useResolveReport
  };
};
