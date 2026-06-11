// RentEase Booking Controller Layer
// Parses incoming request arguments and returns sanitized DTO response objects.

import { bookingService } from "../services/booking.service.js";
import { bookingAnalyticsService } from "../services/bookingAnalytics.service.js";
import { createBookingSchema, updateBookingStatusSchema } from "../validators/booking.validator.js";
import { BookingSummaryDTO, BookingDetailDTO } from "../dtos/booking.dto.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class BookingController {
  /**
   * 1. Request reservation (Tenants only)
   */
  requestBooking = asyncHandler(async (req, res) => {
    // Run validator validation checks
    const validatedData = createBookingSchema.parse(req.body);

    const booking = await bookingService.requestBooking(req.user.id, validatedData);
    const dto = BookingSummaryDTO.transform(booking);

    return new ApiResponse(201, "Booking request submitted successfully", { booking: dto }).send(res);
  });

  /**
   * 2. Retrieve bookings list matching filters (paginated, sorted, filtered)
   */
  getUserBookings = asyncHandler(async (req, res) => {
    const { bookings, count } = await bookingService.getUserBookings(req.user.id, req.user.role, req.query);
    const dtos = BookingSummaryDTO.transform(bookings);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    return new ApiResponse(200, "User bookings retrieved successfully", {
      bookings: dtos,
      pagination: {
        page,
        limit,
        totalResults: count,
        totalPages: Math.ceil(count / limit)
      }
    }).send(res);
  });

  /**
   * 3. Fetch availability blockout dates for a property
   */
  getAvailability = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const ranges = await bookingService.getAvailability(propertyId);

    // Optimized response: returns only { blocked: [{ checkIn, checkOut }] }
    return new ApiResponse(200, "Availability ranges retrieved successfully", { blocked: ranges }).send(res);
  });

  /**
   * 4. Fetch details for a specific booking
   */
  getBookingById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(req.user.id, req.user.role, id);
    const dto = BookingDetailDTO.transform(booking);

    return new ApiResponse(200, "Booking details retrieved successfully", { booking: dto }).send(res);
  });

  /**
   * 5. Approve a pending booking (Landlords only)
   */
  approveBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const booking = await bookingService.approveBooking(req.user.id, id);
    const dto = BookingDetailDTO.transform(booking);

    return new ApiResponse(200, "Booking approved and confirmed successfully", { booking: dto }).send(res);
  });

  /**
   * 6. Reject a pending booking (Landlords only)
   */
  rejectBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cancellationReason } = updateBookingStatusSchema.parse(req.body);

    const booking = await bookingService.rejectBooking(req.user.id, id, cancellationReason);
    const dto = BookingDetailDTO.transform(booking);

    return new ApiResponse(200, "Booking request declined successfully", { booking: dto }).send(res);
  });

  /**
   * 7. Cancel a booking
   */
  cancelBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cancellationReason } = updateBookingStatusSchema.parse(req.body);

    const booking = await bookingService.cancelBooking(req.user.id, req.user.role, id, cancellationReason);
    const dto = BookingDetailDTO.transform(booking);

    return new ApiResponse(200, "Booking cancelled successfully", { booking: dto }).send(res);
  });

  /**
   * 8. Fetch dashboard summary statistics metrics
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    let stats;
    if (req.user.role === "LANDLORD") {
      stats = await bookingAnalyticsService.getLandlordStats(req.user.id);
    } else {
      stats = await bookingAnalyticsService.getTenantStats(req.user.id);
    }

    return new ApiResponse(200, "Dashboard statistics metrics retrieved successfully", { stats }).send(res);
  });
}

export const bookingController = new BookingController();
