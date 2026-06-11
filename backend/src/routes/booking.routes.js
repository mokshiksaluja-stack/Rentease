// RentEase Booking Routes Configurations
// Defines endpoint routes and mounts authorization middleware.

import { Router } from "express";
import { bookingController } from "../controllers/booking.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// 1. Fetch Availability (Public endpoint - no authentication required to view calendar blockouts)
router.get("/availability/:propertyId", bookingController.getAvailability);

// 2. Authenticated Endpoints (Required to view/manage bookings)
router.use(authenticate); // Mount authentication globally for the remaining routes below

// Fetch list matching role context (Tenant gets own, Landlord gets property reservations, Admin gets all)
router.get("/", bookingController.getUserBookings);

// Fetch stats summary metrics
router.get("/stats", bookingController.getDashboardStats);

// Fetch details for a specific booking
router.get("/:id", bookingController.getBookingById);

// Request reservation
router.post("/", authorize("TENANT"), bookingController.requestBooking);

// Approve a pending booking (Landlords only)
router.patch("/:id/approve", authorize("LANDLORD"), bookingController.approveBooking);

// Reject a pending booking (Landlords only)
router.patch("/:id/reject", authorize("LANDLORD"), bookingController.rejectBooking);

// Cancel a booking (Tenant who booked, or the Landlord)
router.patch("/:id/cancel", bookingController.cancelBooking);

export default router;
