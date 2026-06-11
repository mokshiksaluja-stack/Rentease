import { prisma } from "../config/prisma.js";

export const adminRepository = {
  // ─────────────────────────────────────────────────────────
  // DASHBOARD ANALYTICS
  // ─────────────────────────────────────────────────────────

  /**
   * Run all dashboard count queries in parallel for performance.
   */
  getDashboardCounts: async () => {
    const [
      totalUsers,
      totalTenants,
      totalLandlords,
      totalProperties,
      activeProperties,
      approvedProperties,
      totalBookings,
      confirmedBookings,
      completedBookings,
      revenueResult,
      openReports
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: "TENANT" } }),
      prisma.user.count({ where: { role: "LANDLORD" } }),
      prisma.property.count(),
      prisma.property.count({ where: { isAvailable: true } }),
      prisma.property.count({ where: { isApproved: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.payment.aggregate({
        where: { status: "SUCCEEDED" },
        _sum: { amount: true }
      }),
      prisma.report.count({ where: { status: "OPEN" } })
    ]);

    const suspendedUsers = await prisma.user.count({ where: { isSuspended: true } });

    return {
      totalUsers,
      totalTenants,
      totalLandlords,
      suspendedUsers,
      totalProperties,
      activeProperties,
      approvedProperties,
      totalBookings,
      confirmedBookings,
      completedBookings,
      totalRevenue: Number(revenueResult._sum.amount || 0),
      openReports
    };
  },

  /**
   * Monthly revenue for the last N months (defaults 6).
   */
  getMonthlyRevenue: async (months = 6) => {
    const today = new Date();
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const result = await prisma.payment.aggregate({
        where: { status: "SUCCEEDED", processedAt: { gte: start, lte: end } },
        _sum: { amount: true }
      });
      data.push({
        month: start.toLocaleString("default", { month: "short", year: "numeric" }),
        revenue: Number(result._sum.amount || 0)
      });
    }
    return data;
  },

  /**
   * New user registrations per month for the last N months.
   */
  getUserGrowth: async (months = 6) => {
    const today = new Date();
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const count = await prisma.user.count({
        where: { createdAt: { gte: start, lte: end } }
      });
      data.push({ month: start.toLocaleString("default", { month: "short", year: "numeric" }), count });
    }
    return data;
  },

  /**
   * New booking requests per month for the last N months.
   */
  getBookingGrowth: async (months = 6) => {
    const today = new Date();
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const count = await prisma.booking.count({
        where: { createdAt: { gte: start, lte: end } }
      });
      data.push({ month: start.toLocaleString("default", { month: "short", year: "numeric" }), count });
    }
    return data;
  },

  // ─────────────────────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────────────────────

  listUsers: async ({ page = 1, limit = 15, role, search, isSuspended }) => {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = {};
    if (role) where.role = role;
    if (isSuspended !== undefined) where.isSuspended = isSuspended === "true";
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, role: true,
          avatar: true, isSuspended: true, isEmailVerified: true,
          isOnline: true, lastSeen: true, createdAt: true,
          _count: { select: { bookings: true, properties: true } }
        }
      }),
      prisma.user.count({ where })
    ]);
    return { users, total };
  },

  getUserById: async (id) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, isSuspended: true, isEmailVerified: true,
        isOnline: true, lastSeen: true, createdAt: true, updatedAt: true,
        _count: { select: { bookings: true, properties: true, reviews: true } }
      }
    });
  },

  suspendUser: async (id) => {
    return prisma.user.update({ where: { id }, data: { isSuspended: true } });
  },

  activateUser: async (id) => {
    return prisma.user.update({ where: { id }, data: { isSuspended: false } });
  },

  // ─────────────────────────────────────────────────────────
  // PROPERTY MODERATION
  // ─────────────────────────────────────────────────────────

  listProperties: async ({ page = 1, limit = 15, isApproved, search, city }) => {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = {};
    if (isApproved !== undefined && isApproved !== "") where.isApproved = isApproved === "true";
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } }
      ];
    }
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          landlord: { select: { id: true, name: true, email: true, avatar: true } },
          images: { take: 1, orderBy: { orderIndex: "asc" } },
          _count: { select: { bookings: true, reviews: true } }
        }
      }),
      prisma.property.count({ where })
    ]);
    return { properties, total };
  },

  approveProperty: async (id) => {
    return prisma.property.update({ where: { id }, data: { isApproved: true, rejectedNote: null } });
  },

  rejectProperty: async (id, note) => {
    return prisma.property.update({ where: { id }, data: { isApproved: false, rejectedNote: note || "Rejected by admin" } });
  },

  // ─────────────────────────────────────────────────────────
  // REPORTS SYSTEM
  // ─────────────────────────────────────────────────────────

  createReport: async (data) => {
    return prisma.report.create({ data, include: { reporter: { select: { id: true, name: true, email: true } } } });
  },

  listReports: async ({ page = 1, limit = 15, status, targetType }) => {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { reporter: { select: { id: true, name: true, email: true, avatar: true } } }
      }),
      prisma.report.count({ where })
    ]);
    return { reports, total };
  },

  updateReportStatus: async (id, status) => {
    return prisma.report.update({
      where: { id },
      data: {
        status,
        resolvedAt: ["RESOLVED", "DISMISSED"].includes(status) ? new Date() : null
      }
    });
  }
};
