// RentEase Booking Input Validator Schema
// Validates incoming HTTP request body shapes using Zod.

import { z } from "zod";
import { BOOKING_STATUS } from "../constants/bookingStatus.js";

// Helper to check if a date string is valid and not in the past (midnight check)
const parseLocalDate = (dateStr) => {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
};

export const createBookingSchema = z.object({
  propertyId: z.string({
    required_error: "Property ID is required"
  }).uuid({
    message: "Invalid Property ID format. Must be a valid UUID."
  }),

  checkIn: z.string({
    required_error: "Check-in date is required"
  }).refine((val) => {
    const parsed = parseLocalDate(val);
    if (!parsed) return false;
    
    // Normalize today to start of day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed >= today;
  }, {
    message: "Check-in date cannot be in the past"
  }),

  checkOut: z.string({
    required_error: "Check-out date is required"
  }).refine((val) => {
    const parsed = parseLocalDate(val);
    return !!parsed;
  }, {
    message: "Invalid check-out date format"
  }),

  notes: z.string().max(500, { message: "Notes cannot exceed 500 characters" }).optional()
}).refine((data) => {
  const checkInDate = parseLocalDate(data.checkIn);
  const checkOutDate = parseLocalDate(data.checkOut);
  
  if (!checkInDate || !checkOutDate) return false;
  
  // Enforce checkout occurs after checkin (at least 1 night)
  const differenceInTime = checkOutDate.getTime() - checkInDate.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  return differenceInDays >= 1;
}, {
  message: "Check-out date must be at least 1 night after the check-in date",
  path: ["checkOut"] // Target checkOut field in error message
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.REJECTED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.COMPLETED
  ], {
    error_map: () => ({ message: "Invalid status value. Must be CONFIRMED, REJECTED, CANCELLED, or COMPLETED" })
  }),
  
  cancellationReason: z.string().max(300, { message: "Cancellation reason cannot exceed 300 characters" }).optional()
});
