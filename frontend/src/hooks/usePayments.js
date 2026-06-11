// RentEase Payments React Query Hook Layer
// Integrates payments API endpoints with React Query caching and invalidation.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api.js";
import toast from "react-hot-toast";

export const usePayments = () => {
  const queryClient = useQueryClient();

  // 1. Create a PaymentIntent for a confirmed booking
  const useCreatePaymentIntent = () => {
    return useMutation({
      mutationFn: async ({ bookingId }) => {
        const response = await api.post("/payments/create-intent", { bookingId });
        return response.data?.data;
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to initiate checkout process");
      }
    });
  };

  // 2. Confirm simulated payment (Simulation fallback mode)
  const useConfirmPaymentSimulated = () => {
    return useMutation({
      mutationFn: async ({ paymentIntentId }) => {
        const response = await api.post("/payments/confirm", { paymentIntentId });
        return response.data?.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries(["user-bookings"]);
        queryClient.invalidateQueries(["payment-history"]);
        queryClient.invalidateQueries(["financial-analytics"]);
        if (data?.bookingId) {
          queryClient.invalidateQueries(["booking-details", data.bookingId]);
        }
        toast.success("Payment processed and confirmed! (SIMULATED)");
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to confirm payment");
      }
    });
  };

  // 3. Fetch paginated user payment transaction history
  const usePaymentHistory = (queryParams = {}) => {
    return useQuery({
      queryKey: ["payment-history", queryParams],
      queryFn: async () => {
        const response = await api.get("/payments/history", { params: queryParams });
        return response.data?.data;
      },
      placeholderData: (previousData) => previousData, // Maintain previous page data during pagination
    });
  };

  // 4. Fetch details for a specific payment transaction
  const usePaymentDetails = (id) => {
    return useQuery({
      queryKey: ["payment-details", id],
      queryFn: async () => {
        const response = await api.get(`/payments/${id}`);
        return response.data?.data;
      },
      enabled: !!id
    });
  };

  // 5. Fetch financial dashboard analytics summary & trends (for landlord overview)
  const useFinancialAnalytics = () => {
    return useQuery({
      queryKey: ["financial-analytics"],
      queryFn: async () => {
        const response = await api.get("/payments/analytics");
        return response.data?.data;
      }
    });
  };

  return {
    useCreatePaymentIntent,
    useConfirmPaymentSimulated,
    usePaymentHistory,
    usePaymentDetails,
    useFinancialAnalytics
  };
};
