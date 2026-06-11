// RentEase Booking Events Coordinator Service
// Centralizes all booking lifecycle notifications, logging, and future integration events.

import { bookingTimelineRepository } from "../repositories/bookingTimeline.repository.js";
import { notificationService } from "./notification.service.js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";

export const bookingEventsService = {
  /**
   * Dispatched immediately after a tenant creates a booking request.
   */
  dispatchCreated: async (booking) => {
    try {
      console.log(`%c🔔 [Event: booking_created] Reference: ${booking.bookingReference}`, "color: #6366f1; font-weight: bold;");
      
      const note = booking.notes 
        ? `Booking requested by tenant. Special note: "${booking.notes}"`
        : "Booking requested by tenant.";

      await bookingTimelineRepository.create(booking.id, "BOOKING_CREATED", note);
      
      // Dispatch in-app and push notification to the Landlord
      await notificationService.createNotification(booking.property.landlordId, {
        type: NOTIFICATION_TYPES.BOOKING_CREATED,
        title: "New Booking Request",
        body: `Tenant ${booking.tenant.name} has requested to book your property "${booking.property.title}".`,
        metadata: {
          bookingId: booking.id,
          propertyId: booking.propertyId
        }
      });
    } catch (err) {
      console.error("Failed to process booking_created event:", err.message);
    }
  },

  /**
   * Dispatched when a landlord approves a pending booking.
   */
  dispatchApproved: async (booking) => {
    try {
      console.log(`%c🔔 [Event: booking_approved] Reference: ${booking.bookingReference}`, "color: #10b981; font-weight: bold;");
      
      await bookingTimelineRepository.create(booking.id, "BOOKING_APPROVED", "Reservation approved by landlord.");

      // Dispatch in-app and push notification to the Tenant
      await notificationService.createNotification(booking.tenantId, {
        type: NOTIFICATION_TYPES.BOOKING_APPROVED,
        title: "Booking Request Approved",
        body: `Your booking request for "${booking.property.title}" has been approved by the landlord.`,
        metadata: {
          bookingId: booking.id,
          propertyId: booking.propertyId
        }
      });
    } catch (err) {
      console.error("Failed to process booking_approved event:", err.message);
    }
  },

  /**
   * Dispatched when a landlord rejects a pending booking.
   */
  dispatchRejected: async (booking, reason = null) => {
    try {
      console.log(`%c🔔 [Event: booking_rejected] Reference: ${booking.bookingReference}`, "color: #ef4444; font-weight: bold;");
      
      const note = reason 
        ? `Reservation declined by landlord. Reason: "${reason}"`
        : "Reservation declined by landlord.";

      await bookingTimelineRepository.create(booking.id, "BOOKING_REJECTED", note);

      // Dispatch in-app and push notification to the Tenant
      await notificationService.createNotification(booking.tenantId, {
        type: NOTIFICATION_TYPES.BOOKING_REJECTED,
        title: "Booking Request Rejected",
        body: `Your booking request for "${booking.property.title}" has been rejected. Reason: ${reason || "Not specified"}.`,
        metadata: {
          bookingId: booking.id,
          propertyId: booking.propertyId
        }
      });
    } catch (err) {
      console.error("Failed to process booking_rejected event:", err.message);
    }
  },

  /**
   * Dispatched when a booking is cancelled by a tenant or landlord.
   */
  dispatchCancelled: async (booking, actorRole, reason = null) => {
    try {
      console.log(`%c🔔 [Event: booking_cancelled] Reference: ${booking.bookingReference}`, "color: #f59e0b; font-weight: bold;");
      
      const note = reason 
        ? `Reservation cancelled by ${actorRole.toLowerCase()}. Reason: "${reason}"`
        : `Reservation cancelled by ${actorRole.toLowerCase()}.`;

      await bookingTimelineRepository.create(booking.id, "BOOKING_CANCELLED", note);

      // Notify the counterparty about the cancellation
      const isTenantCanceller = actorRole === "TENANT";
      const targetUserId = isTenantCanceller ? booking.property.landlordId : booking.tenantId;
      const targetTitle = isTenantCanceller ? "Booking Cancelled by Tenant" : "Booking Cancelled by Landlord";
      const targetBody = isTenantCanceller 
        ? `Tenant has cancelled the reservation for your property "${booking.property.title}".`
        : `The landlord has cancelled your reservation for "${booking.property.title}".`;

      await notificationService.createNotification(targetUserId, {
        type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
        title: targetTitle,
        body: targetBody,
        metadata: {
          bookingId: booking.id,
          propertyId: booking.propertyId
        }
      });
    } catch (err) {
      console.error("Failed to process booking_cancelled event:", err.message);
    }
  },

  /**
   * Dispatched when stay checkout date passes (completed stay).
   */
  dispatchCompleted: async (booking) => {
    try {
      console.log(`%c🔔 [Event: booking_completed] Reference: ${booking.bookingReference}`, "color: #3b82f6; font-weight: bold;");
      
      await bookingTimelineRepository.create(booking.id, "BOOKING_COMPLETED", "Stay completed successfully.");

      // Future integrations hook:
      // - Send feedback request email to Tenant to submit a review
      // - Release payout funds to Landlord bank account
    } catch (err) {
      console.error("Failed to process booking_completed event:", err.message);
    }
  }
};
