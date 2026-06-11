// RentEase Booking Database Repository
// Interfaces directly with the Prisma Client to perform queries and transactions.

import { prisma } from "../config/prisma.js";

export const bookingRepository = {
  /**
   * Create a new booking request in the database.
   */
  create: async (bookingData) => {
    return prisma.booking.create({
      data: {
        ...bookingData,
        checkIn: new Date(bookingData.checkIn),
        checkOut: new Date(bookingData.checkOut)
      },
      include: {
        property: {
          include: {
            images: {
              orderBy: { orderIndex: "asc" }
            }
          }
        },
        tenant: true
      }
    });
  },

  /**
   * Find a booking by its UUID.
   */
  findById: async (id) => {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            images: {
              orderBy: { orderIndex: "asc" }
            },
            landlord: true
          }
        },
        tenant: true,
        timeline: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
  },

  /**
   * Find a booking by its user-friendly reference string.
   */
  findByReference: async (bookingReference) => {
    return prisma.booking.findUnique({
      where: { bookingReference },
      include: {
        property: {
          include: {
            images: {
              orderBy: { orderIndex: "asc" }
            },
            landlord: true
          }
        },
        tenant: true,
        timeline: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
  },

  /**
   * Find overlapping CONFIRMED bookings for a property during requested dates.
   */
  findOverlappingBookings: async (propertyId, checkIn, checkOut, excludeBookingId = null) => {
    return prisma.booking.findFirst({
      where: {
        propertyId,
        status: "CONFIRMED",
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        OR: [
          {
            checkIn: { lt: new Date(checkOut) },
            checkOut: { gt: new Date(checkIn) }
          }
        ]
      }
    });
  },

  /**
   * Retrieve minimal dates of all confirmed bookings for a property (availability check).
   */
  findAvailabilityRanges: async (propertyId) => {
    return prisma.booking.findMany({
      where: {
        propertyId,
        status: "CONFIRMED"
      },
      select: {
        checkIn: true,
        checkOut: true
      },
      orderBy: {
        checkIn: "asc"
      }
    });
  },

  /**
   * Fetch bookings requested by a tenant (paginated, filtered, and sorted).
   */
  findTenantBookings: async (tenantId, { skip = 0, take = 10, status, search, sortBy = "createdAt", sortOrder = "desc" }) => {
    const where = {
      tenantId,
      status: status || undefined,
      OR: search ? [
        { bookingReference: { contains: search, mode: "insensitive" } },
        { property: { title: { contains: search, mode: "insensitive" } } }
      ] : undefined
    };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          include: {
            images: {
              orderBy: { orderIndex: "asc" }
            }
          }
        },
        tenant: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take
    });

    const count = await prisma.booking.count({ where });

    return { bookings, count };
  },

  /**
   * Fetch bookings received by a landlord (paginated, filtered, and sorted).
   */
  findLandlordBookings: async (landlordId, { skip = 0, take = 10, status, search, sortBy = "createdAt", sortOrder = "desc" }) => {
    const where = {
      property: {
        landlordId
      },
      status: status || undefined,
      OR: search ? [
        { bookingReference: { contains: search, mode: "insensitive" } },
        { property: { title: { contains: search, mode: "insensitive" } } }
      ] : undefined
    };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          include: {
            images: {
              orderBy: { orderIndex: "asc" }
            }
          }
        },
        tenant: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take
    });

    const count = await prisma.booking.count({ where });

    return { bookings, count };
  },

  /**
   * Update status and optionally cancellationReason of a booking.
   */
  updateStatus: async (id, status, cancellationReason = null) => {
    return prisma.booking.update({
      where: { id },
      data: {
        status,
        cancellationReason
      },
      include: {
        property: {
          include: {
            images: {
              orderBy: { orderIndex: "asc" }
            },
            landlord: true
          }
        },
        tenant: true
      }
    });
  },

  /**
   * Fetch bookings list with global admin filters.
   */
  findBookingsWithFilters: async ({ skip = 0, take = 10, status, search, sortBy = "createdAt", sortOrder = "desc" }) => {
    const where = {
      status: status || undefined,
      OR: search ? [
        { bookingReference: { contains: search, mode: "insensitive" } },
        { property: { title: { contains: search, mode: "insensitive" } } },
        { tenant: { name: { contains: search, mode: "insensitive" } } }
      ] : undefined
    };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          include: {
            images: {
              orderBy: { orderIndex: "asc" }
            }
          }
        },
        tenant: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take
    });

    const count = await prisma.booking.count({ where });

    return { bookings, count };
  }
};
