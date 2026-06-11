// RentEase Bookings React Query Hook Layer
// Integrates API endpoints with state caching, pagination, and optimistic updates.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api.js";
import toast from "react-hot-toast";

export const useBookings = (filters = {}) => {
  const queryClient = useQueryClient();

  // 1. Fetch user bookings list (paginated, sorted, filtered)
  const useUserBookings = (queryParams) => {
    return useQuery({
      queryKey: ["user-bookings", queryParams],
      queryFn: async () => {
        const response = await api.get("/bookings", { params: queryParams });
        return response.data?.data;
      },
      keepPreviousData: true
    });
  };

  // 2. Fetch details for a specific booking
  const useBookingDetails = (id) => {
    return useQuery({
      queryKey: ["booking-details", id],
      queryFn: async () => {
        const response = await api.get(`/bookings/${id}`);
        return response.data?.data?.booking;
      },
      enabled: !!id
    });
  };

  // 3. Fetch availability blockout dates for a property
  const useAvailability = (propertyId) => {
    return useQuery({
      queryKey: ["availability", propertyId],
      queryFn: async () => {
        const response = await api.get(`/bookings/availability/${propertyId}`);
        return response.data?.data?.blocked || [];
      },
      enabled: !!propertyId
    });
  };

  // 4. Request a booking (Create mutation)
  const useCreateBooking = () => {
    return useMutation({
      mutationFn: async (payload) => {
        const response = await api.post("/bookings", payload);
        return response.data?.data?.booking;
      },
      onSuccess: (newBooking) => {
        queryClient.invalidateQueries(["user-bookings"]);
        queryClient.invalidateQueries(["availability", newBooking.propertyId]);
        toast.success("Booking request submitted successfully!");
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to submit booking request");
      }
    });
  };

  // 5. Approve a pending booking (Landlords only - Optimistic update)
  const useApproveBooking = () => {
    return useMutation({
      mutationFn: async (id) => {
        const response = await api.patch(`/bookings/${id}/approve`);
        return response.data?.data?.booking;
      },
      // Perform optimistic cache updates
      onMutate: async (id) => {
        // Cancel active queries to prevent overwriting optimistic state
        await queryClient.cancelQueries(["user-bookings"]);
        await queryClient.cancelQueries(["booking-details", id]);

        // Capture previous cache state for rollback snapshot
        const previousBookings = queryClient.getQueryData(["user-bookings"]);
        const previousDetails = queryClient.getQueryData(["booking-details", id]);

        // Optimistically update details view cache
        if (previousDetails) {
          queryClient.setQueryData(["booking-details", id], {
            ...previousDetails,
            status: "CONFIRMED"
          });
        }

        // Optimistically update dashboard list view cache
        queryClient.setQueryData(["user-bookings"], (old) => {
          if (!old) return old;
          return {
            ...old,
            bookings: old.bookings.map(b => b.id === id ? { ...b, status: "CONFIRMED" } : b)
          };
        });

        return { previousBookings, previousDetails };
      },
      onError: (err, id, context) => {
        // Rollback to cached snapshot
        if (context?.previousBookings) {
          queryClient.setQueryData(["user-bookings"], context.previousBookings);
        }
        if (context?.previousDetails) {
          queryClient.setQueryData(["booking-details", id], context.previousDetails);
        }
        toast.error(err.response?.data?.message || "Failed to approve booking request");
      },
      onSuccess: () => {
        toast.success("Booking approved and confirmed!");
      },
      onSettled: (data, error, id) => {
        // Refetch to sync state
        queryClient.invalidateQueries(["user-bookings"]);
        queryClient.invalidateQueries(["booking-details", id]);
        if (data) queryClient.invalidateQueries(["availability", data.propertyId]);
      }
    });
  };

  // 6. Reject a pending booking (Landlords only - Optimistic update)
  const useRejectBooking = () => {
    return useMutation({
      mutationFn: async ({ id, cancellationReason }) => {
        const response = await api.patch(`/bookings/${id}/reject`, { cancellationReason });
        return response.data?.data?.booking;
      },
      onMutate: async ({ id, cancellationReason }) => {
        await queryClient.cancelQueries(["user-bookings"]);
        await queryClient.cancelQueries(["booking-details", id]);

        const previousBookings = queryClient.getQueryData(["user-bookings"]);
        const previousDetails = queryClient.getQueryData(["booking-details", id]);

        if (previousDetails) {
          queryClient.setQueryData(["booking-details", id], {
            ...previousDetails,
            status: "REJECTED",
            cancellationReason
          });
        }

        queryClient.setQueryData(["user-bookings"], (old) => {
          if (!old) return old;
          return {
            ...old,
            bookings: old.bookings.map(b => b.id === id ? { ...b, status: "REJECTED" } : b)
          };
        });

        return { previousBookings, previousDetails };
      },
      onError: (err, { id }, context) => {
        if (context?.previousBookings) {
          queryClient.setQueryData(["user-bookings"], context.previousBookings);
        }
        if (context?.previousDetails) {
          queryClient.setQueryData(["booking-details", id], context.previousDetails);
        }
        toast.error(err.response?.data?.message || "Failed to reject booking request");
      },
      onSuccess: () => {
        toast.success("Booking request declined.");
      },
      onSettled: (data, error, { id }) => {
        queryClient.invalidateQueries(["user-bookings"]);
        queryClient.invalidateQueries(["booking-details", id]);
      }
    });
  };

  // 7. Cancel a booking (Optimistic update)
  const useCancelBooking = () => {
    return useMutation({
      mutationFn: async ({ id, cancellationReason }) => {
        const response = await api.patch(`/bookings/${id}/cancel`, { cancellationReason });
        return response.data?.data?.booking;
      },
      onMutate: async ({ id, cancellationReason }) => {
        await queryClient.cancelQueries(["user-bookings"]);
        await queryClient.cancelQueries(["booking-details", id]);

        const previousBookings = queryClient.getQueryData(["user-bookings"]);
        const previousDetails = queryClient.getQueryData(["booking-details", id]);

        if (previousDetails) {
          queryClient.setQueryData(["booking-details", id], {
            ...previousDetails,
            status: "CANCELLED",
            cancellationReason
          });
        }

        queryClient.setQueryData(["user-bookings"], (old) => {
          if (!old) return old;
          return {
            ...old,
            bookings: old.bookings.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b)
          };
        });

        return { previousBookings, previousDetails };
      },
      onError: (err, { id }, context) => {
        if (context?.previousBookings) {
          queryClient.setQueryData(["user-bookings"], context.previousBookings);
        }
        if (context?.previousDetails) {
          queryClient.setQueryData(["booking-details", id], context.previousDetails);
        }
        toast.error(err.response?.data?.message || "Failed to cancel booking request");
      },
      onSuccess: () => {
        toast.success("Booking cancelled successfully.");
      },
      onSettled: (data, error, { id }) => {
        queryClient.invalidateQueries(["user-bookings"]);
        queryClient.invalidateQueries(["booking-details", id]);
        if (data) queryClient.invalidateQueries(["availability", data.propertyId]);
      }
    });
  };

  // 8. Fetch dashboard stats
  const useDashboardStats = () => {
    return useQuery({
      queryKey: ["booking-stats"],
      queryFn: async () => {
        const response = await api.get("/bookings/stats");
        return response.data?.data?.stats;
      }
    });
  };

  return {
    useUserBookings,
    useBookingDetails,
    useAvailability,
    useCreateBooking,
    useApproveBooking,
    useRejectBooking,
    useCancelBooking,
    useDashboardStats
  };
};
