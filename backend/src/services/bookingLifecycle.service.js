// RentEase Booking Lifecycle Automation Service
// Prepares the backend layout to support cron-based check-out auto-completions.

import { prisma } from "../config/prisma.js";
import { bookingEventsService } from "./bookingEvents.service.js";
import { BOOKING_STATUS } from "../constants/bookingStatus.js";

export const bookingLifecycleService = {
  /**
   * Automation cron runner stub:
   * Query all CONFIRMED bookings whose checkOut dates have passed,
   * transition them to COMPLETED, and trigger lifecycle complete events.
   */
  processCheckoutCompletions: async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Query database for checked-out listings
      const completedBookings = await prisma.booking.findMany({
        where: {
          status: BOOKING_STATUS.CONFIRMED,
          checkOut: {
            lt: today // Check-out date is in the past relative to today
          }
        },
        include: {
          property: {
            include: {
              images: { orderBy: { orderIndex: "asc" } },
              landlord: true
            }
          },
          tenant: true
        }
      });

      if (completedBookings.length === 0) return 0;

      console.log(`[Lifecycle Service]: Processing check-out completions for ${completedBookings.length} bookings...`);

      // Update statuses in batch and dispatch events
      let successCount = 0;
      for (const booking of completedBookings) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: BOOKING_STATUS.COMPLETED }
        });

        // Publish events
        await bookingEventsService.dispatchCompleted(booking);
        successCount++;
      }

      return successCount;
    } catch (err) {
      console.error("Lifecycle check-out automation processing failed:", err.message);
      return 0;
    }
  }
};
