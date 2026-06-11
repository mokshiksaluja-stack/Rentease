// RentEase Booking Analytics Calculation Service
// Serves metrics aggregates and projected revenue estimates to feed user dashboards.

import { prisma } from "../config/prisma.js";
import { BOOKING_STATUS } from "../constants/bookingStatus.js";

export const bookingAnalyticsService = {
  /**
   * Calculate summary metrics for a tenant
   */
  getTenantStats: async (tenantId) => {
    const counts = await prisma.booking.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true }
    });

    const stats = {
      active: 0,
      pending: 0,
      completed: 0
    };

    counts.forEach((item) => {
      if (item.status === BOOKING_STATUS.CONFIRMED) stats.active += item._count.id;
      if (item.status === BOOKING_STATUS.PENDING) stats.pending += item._count.id;
      if (item.status === BOOKING_STATUS.COMPLETED) stats.completed += item._count.id;
    });

    return stats;
  },

  /**
   * Calculate summary metrics and estimated revenue for a landlord
   */
  getLandlordStats: async (landlordId) => {
    const whereClause = {
      property: { landlordId }
    };

    // Retrieve status counts using database aggregation
    const counts = await prisma.booking.groupBy({
      by: ["status"],
      where: whereClause,
      _count: { id: true }
    });

    const stats = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      revenueEstimate: 0.00
    };

    counts.forEach((item) => {
      if (item.status === BOOKING_STATUS.PENDING) stats.pending = item._count.id;
      if (item.status === BOOKING_STATUS.CONFIRMED) stats.confirmed = item._count.id;
      if (item.status === BOOKING_STATUS.COMPLETED) stats.completed = item._count.id;
    });

    // Calculate monthly revenue estimate (sum of CONFIRMED or COMPLETED bookings rent)
    const revenueSum = await prisma.booking.aggregate({
      _sum: {
        totalAmount: true
      },
      where: {
        ...whereClause,
        status: { in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] }
      }
    });

    stats.revenueEstimate = Number(revenueSum._sum.totalAmount) || 0.00;

    return stats;
  }
};
