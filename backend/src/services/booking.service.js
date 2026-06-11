// RentEase Booking Business Service Layer
// Implements overlap validations, state machine triggers, and Prisma atomic transactions.

import { bookingRepository } from "../repositories/booking.repository.js";
import { bookingEventsService } from "./bookingEvents.service.js";
import { propertyRepository } from "../repositories/property.repository.js";
import { BOOKING_STATUS, BOOKING_PAYMENT_STATUS, ALLOWED_STATUS_TRANSITIONS } from "../constants/bookingStatus.js";
import { prisma } from "../config/prisma.js";

/**
 * Generate sequence-incremented booking references (Format: RE-YYYY-000001)
 */
const generateBookingReference = async () => {
  const currentYear = new Date().getFullYear();
  
  // Find count of bookings created within the current calendar year
  const count = await prisma.booking.count({
    where: {
      createdAt: {
        gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`)
      }
    }
  });

  const seq = String(count + 1).padStart(6, "0");
  return `RE-${currentYear}-${seq}`;
};

export const bookingService = {
  /**
   * Submit a new booking request (Tenants only)
   */
  requestBooking: async (tenantId, { propertyId, checkIn, checkOut, notes }) => {
    // 1. Verify property exists and is active
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      const err = new Error("Requested property listing does not exist");
      err.statusCode = 404;
      throw err;
    }

    if (!property.isAvailable) {
      const err = new Error("Property listing is currently marked as unavailable/rented");
      err.statusCode = 400;
      throw err;
    }

    // 2. Prevent landlord from renting their own properties
    if (property.landlordId === tenantId) {
      const err = new Error("Landlords cannot request reservations on their own properties");
      err.statusCode = 400;
      throw err;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // 3. Verify dates do not overlap with an already CONFIRMED booking
    const hasOverlap = await bookingRepository.findOverlappingBookings(propertyId, checkInDate, checkOutDate);
    if (hasOverlap) {
      const err = new Error("Conflict: Selected dates overlap with an existing confirmed reservation");
      err.statusCode = 409;
      throw err;
    }

    // 4. Calculate total amount (Daily Rate = monthlyRent / 30)
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    const dailyRate = Number(property.rent) / 30;
    const totalAmount = dailyRate * nights;

    // 5. Generate unique sequence reference code
    const bookingReference = await generateBookingReference();

    // 6. Write booking record to database
    const booking = await bookingRepository.create({
      bookingReference,
      propertyId,
      tenantId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalAmount,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: BOOKING_PAYMENT_STATUS.UNPAID,
      paymentRequired: true,
      notes
    });

    // 7. Dispatch event asynchronously
    await bookingEventsService.dispatchCreated(booking);

    return booking;
  },

  /**
   * Approve a pending booking (Landlords only - transactional)
   * Prevents race conditions and automatically declines conflicting pending requests.
   */
  approveBooking: async (landlordId, bookingId) => {
    // Execute atomic transaction to prevent double bookings
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch booking with locking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: true,
          tenant: true
        }
      });

      if (!booking) {
        const err = new Error("Booking request not found");
        err.statusCode = 404;
        throw err;
      }

      // 2. Ownership verification: landlord must own property
      if (booking.property.landlordId !== landlordId) {
        const err = new Error("Forbidden: You do not own the property for this booking request");
        err.statusCode = 403;
        throw err;
      }

      // 3. Validate state transition
      if (booking.status !== BOOKING_STATUS.PENDING) {
        const err = new Error(`Invalid state transition: Cannot approve a booking that is currently ${booking.status}`);
        err.statusCode = 400;
        throw err;
      }

      // 4. Double check for overlaps right before confirmation (Availability Lock)
      const overlap = await tx.booking.findFirst({
        where: {
          propertyId: booking.propertyId,
          status: BOOKING_STATUS.CONFIRMED,
          id: { not: bookingId },
          OR: [
            {
              checkIn: { lt: booking.checkOut },
              checkOut: { gt: booking.checkIn }
            }
          ]
        }
      });

      if (overlap) {
        const err = new Error("Conflict: Selected dates overlap with an already confirmed booking");
        err.statusCode = 409;
        throw err;
      }

      // 5. Approve the selected booking
      const confirmedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BOOKING_STATUS.CONFIRMED },
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

      // 6. Find conflicting PENDING bookings for the same range to auto-decline them
      const conflictingPending = await tx.booking.findMany({
        where: {
          propertyId: booking.propertyId,
          status: BOOKING_STATUS.PENDING,
          id: { not: bookingId },
          OR: [
            {
              checkIn: { lt: booking.checkOut },
              checkOut: { gt: booking.checkIn }
            }
          ]
        }
      });

      // 7. Auto-reject conflicting bookings
      const rejectedBookings = [];
      for (const p of conflictingPending) {
        const r = await tx.booking.update({
          where: { id: p.id },
          data: {
            status: BOOKING_STATUS.REJECTED,
            cancellationReason: "Auto-rejected due to conflicting confirmed reservation"
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
        rejectedBookings.push(r);
      }

      return { confirmedBooking, rejectedBookings };
    });

    // 8. Trigger events outside transaction block to avoid locking threads
    await bookingEventsService.dispatchApproved(result.confirmedBooking);
    for (const r of result.rejectedBookings) {
      await bookingEventsService.dispatchRejected(r, r.cancellationReason);
    }

    return result.confirmedBooking;
  },

  /**
   * Reject a pending booking (Landlords only)
   */
  rejectBooking: async (landlordId, bookingId, reason = null) => {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error("Booking request not found");
      err.statusCode = 404;
      throw err;
    }

    if (booking.property.landlordId !== landlordId) {
      const err = new Error("Forbidden: You do not own the property for this booking request");
      err.statusCode = 403;
      throw err;
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      const err = new Error(`Invalid state transition: Cannot reject a booking that is currently ${booking.status}`);
      err.statusCode = 400;
      throw err;
    }

    const updated = await bookingRepository.updateStatus(bookingId, BOOKING_STATUS.REJECTED, reason);
    await bookingEventsService.dispatchRejected(updated, reason);
    return updated;
  },

  /**
   * Cancel a booking (Tenant who booked, or the Landlord)
   */
  cancelBooking: async (userId, userRole, bookingId, reason = null) => {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      const err = new Error("Booking record not found");
      err.statusCode = 404;
      throw err;
    }

    // Auth Validation:
    // Tenants can only cancel their own requested bookings
    // Landlords can cancel bookings on properties they own
    const isTenantOwner = booking.tenantId === userId;
    const isLandlordOwner = booking.property.landlordId === userId;

    if (!isTenantOwner && !isLandlordOwner && userRole !== "ADMIN") {
      const err = new Error("Forbidden: You are not authorized to cancel this booking");
      err.statusCode = 403;
      throw err;
    }

    // Verify State Machine transition rules
    const allowed = ALLOWED_STATUS_TRANSITIONS[booking.status];
    if (!allowed || !allowed.includes(BOOKING_STATUS.CANCELLED)) {
      const err = new Error(`Invalid state transition: Cannot cancel a booking that is currently ${booking.status}`);
      err.statusCode = 400;
      throw err;
    }

    const updated = await bookingRepository.updateStatus(bookingId, BOOKING_STATUS.CANCELLED, reason);
    await bookingEventsService.dispatchCancelled(updated, userRole, reason);
    return updated;
  },

  /**
   * Retrieve list of bookings matching filters (Supports pagination, status filtering, and searches)
   */
  getUserBookings: async (userId, userRole, queryParams = {}) => {
    const { page = 1, limit = 10, status, search, sortBy = "createdAt", sortOrder = "desc" } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const filters = { skip, take, status, search, sortBy, sortOrder };

    if (userRole === "ADMIN") {
      return bookingRepository.findBookingsWithFilters(filters);
    }

    // Landlords get bookings on properties they own, Tenants get bookings they requested
    if (userRole === "LANDLORD") {
      return bookingRepository.findLandlordBookings(userId, filters);
    }

    return bookingRepository.findTenantBookings(userId, filters);
  },

  /**
   * Fetch a single booking detailed payload (Validates permissions)
   */
  getBookingById: async (userId, userRole, id) => {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      const err = new Error("Booking record not found");
      err.statusCode = 404;
      throw err;
    }

    // Auth validations
    const isTenant = booking.tenantId === userId;
    const isLandlord = booking.property.landlordId === userId;

    if (!isTenant && !isLandlord && userRole !== "ADMIN") {
      const err = new Error("Forbidden: You are not authorized to view this booking file");
      err.statusCode = 403;
      throw err;
    }

    return booking;
  },

  /**
   * Query blocked date ranges for calendars
   */
  getAvailability: async (propertyId) => {
    const ranges = await bookingRepository.findAvailabilityRanges(propertyId);
    
    // Map response structure to optimize payload size, returning only ranges start/end
    return ranges.map(r => ({
      checkIn: r.checkIn.toISOString().split("T")[0],
      checkOut: r.checkOut.toISOString().split("T")[0]
    }));
  }
};
