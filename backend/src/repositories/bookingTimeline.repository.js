// RentEase Booking Timeline Event Repository
// Handles database reads and writes targeting the booking_timelines table.
// Crucial to maintain chronological, immutable audit logs.

import { prisma } from "../config/prisma.js";

export const bookingTimelineRepository = {
  /**
   * Write a new chronological event log to the database.
   * @param {string} bookingId - Parent booking UUID
   * @param {string} status - Event status name (e.g. BOOKING_CREATED)
   * @param {string} [note] - Optional user/system notes describing change context
   */
  create: async (bookingId, status, note = null) => {
    return prisma.bookingTimeline.create({
      data: {
        bookingId,
        status,
        note
      }
    });
  },

  /**
   * Fetch all log events for a specific booking, ordered chronologically
   * @param {string} bookingId - Booking UUID
   */
  findByBookingId: async (bookingId) => {
    return prisma.bookingTimeline.findMany({
      where: { bookingId },
      orderBy: {
        createdAt: "asc" // Oldest event first to form a clean chronological trail
      }
    });
  }
};
