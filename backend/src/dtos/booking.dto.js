// RentEase Booking Data Transfer Objects (DTOs)
// Sanitizes raw Prisma database logs, flattens hierarchies, and protects internal schema fields.

/**
 * Lightweight DTO representing a booking summary for lists & dashboard grids
 */
class BookingSummaryDTO {
  constructor(booking) {
    this.id = booking.id;
    this.bookingReference = booking.bookingReference;
    this.checkIn = booking.checkIn;
    this.checkOut = booking.checkOut;
    this.totalAmount = Number(booking.totalAmount);
    this.status = booking.status;
    this.paymentStatus = booking.paymentStatus;
    this.paymentRequired = booking.paymentRequired;
    this.createdAt = booking.createdAt;

    // Flatten Property details
    if (booking.property) {
      this.propertyId = booking.property.id;
      this.propertyTitle = booking.property.title;
      this.propertyCity = booking.property.city;
      this.propertyState = booking.property.state;
      this.propertyImage = booking.property.images?.[0]?.url || null;
    }

    // Tenant details summary
    if (booking.tenant) {
      this.tenantName = booking.tenant.name;
    }
  }

  static transform(bookings) {
    if (!bookings) return [];
    if (Array.isArray(bookings)) {
      return bookings.map(b => new BookingSummaryDTO(b));
    }
    return new BookingSummaryDTO(bookings);
  }
}

/**
 * Detailed DTO representing comprehensive booking specs for receipt review pages
 */
class BookingDetailDTO {
  constructor(booking) {
    this.id = booking.id;
    this.bookingReference = booking.bookingReference;
    this.checkIn = booking.checkIn;
    this.checkOut = booking.checkOut;
    this.totalAmount = Number(booking.totalAmount);
    this.status = booking.status;
    this.paymentStatus = booking.paymentStatus;
    this.paymentRequired = booking.paymentRequired;
    this.cancellationReason = booking.cancellationReason || null;
    this.notes = booking.notes || null;
    this.createdAt = booking.createdAt;
    this.updatedAt = booking.updatedAt;

    // Property details
    if (booking.property) {
      this.property = {
        id: booking.property.id,
        title: booking.property.title,
        address: booking.property.address,
        city: booking.property.city,
        state: booking.property.state,
        rent: Number(booking.property.rent),
        bedrooms: booking.property.bedrooms,
        bathrooms: booking.property.bathrooms,
        image: booking.property.images?.[0]?.url || null
      };
    }

    // Landlord profile
    if (booking.property?.landlord) {
      this.landlord = {
        id: booking.property.landlord.id,
        name: booking.property.landlord.name,
        email: booking.property.landlord.email,
        avatar: booking.property.landlord.avatar
      };
    }

    // Tenant profile
    if (booking.tenant) {
      this.tenant = {
        id: booking.tenant.id,
        name: booking.tenant.name,
        email: booking.tenant.email,
        avatar: booking.tenant.avatar
      };
    }

    // Chronological Timeline log events
    this.timeline = (booking.timeline || []).map(event => ({
      id: event.id,
      status: event.status,
      note: event.note,
      createdAt: event.createdAt
    }));
  }

  static transform(booking) {
    if (!booking) return null;
    return new BookingDetailDTO(booking);
  }
}

export { BookingSummaryDTO, BookingDetailDTO };
