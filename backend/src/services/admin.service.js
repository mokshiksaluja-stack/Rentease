import { adminRepository } from "../repositories/admin.repository.js";

export const adminService = {
  // ─────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────

  /**
   * Aggregate all platform metrics for the admin overview dashboard.
   */
  getDashboardStats: async () => {
    const [counts, monthlyRevenue, userGrowth, bookingGrowth] = await Promise.all([
      adminRepository.getDashboardCounts(),
      adminRepository.getMonthlyRevenue(6),
      adminRepository.getUserGrowth(6),
      adminRepository.getBookingGrowth(6)
    ]);

    // Calculate booking growth % vs previous month
    const currentMonthBookings = bookingGrowth[bookingGrowth.length - 1]?.count || 0;
    const prevMonthBookings = bookingGrowth[bookingGrowth.length - 2]?.count || 1;
    const bookingGrowthPct = prevMonthBookings === 0
      ? 100
      : Math.round(((currentMonthBookings - prevMonthBookings) / prevMonthBookings) * 100);

    // Calculate user growth % vs previous month
    const currentMonthUsers = userGrowth[userGrowth.length - 1]?.count || 0;
    const prevMonthUsers = userGrowth[userGrowth.length - 2]?.count || 1;
    const userGrowthPct = prevMonthUsers === 0
      ? 100
      : Math.round(((currentMonthUsers - prevMonthUsers) / prevMonthUsers) * 100);

    // Current month revenue
    const monthlyRevenueCurrent = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;

    return {
      ...counts,
      monthlyRevenue: monthlyRevenueCurrent,
      monthlyRevenueTrend: monthlyRevenue,
      userGrowth,
      bookingGrowth,
      bookingGrowthPct,
      userGrowthPct
    };
  },

  // ─────────────────────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────────────────────

  listUsers: async (query) => {
    const { users, total } = await adminRepository.listUsers(query);
    const { page = 1, limit = 15 } = query;
    return {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  },

  getUserProfile: async (id) => {
    const user = await adminRepository.getUserById(id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return user;
  },

  suspendUser: async (adminId, targetId) => {
    if (adminId === targetId) {
      const err = new Error("Admins cannot suspend their own account");
      err.statusCode = 400;
      throw err;
    }
    const user = await adminRepository.getUserById(targetId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    if (user.isSuspended) {
      const err = new Error("User account is already suspended");
      err.statusCode = 409;
      throw err;
    }
    return adminRepository.suspendUser(targetId);
  },

  activateUser: async (adminId, targetId) => {
    if (adminId === targetId) {
      const err = new Error("Invalid operation on own account");
      err.statusCode = 400;
      throw err;
    }
    const user = await adminRepository.getUserById(targetId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    if (!user.isSuspended) {
      const err = new Error("User account is not suspended");
      err.statusCode = 409;
      throw err;
    }
    return adminRepository.activateUser(targetId);
  },

  // ─────────────────────────────────────────────────────────
  // PROPERTY MODERATION
  // ─────────────────────────────────────────────────────────

  listProperties: async (query) => {
    const { properties, total } = await adminRepository.listProperties(query);
    const { page = 1, limit = 15 } = query;
    return {
      properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  },

  approveProperty: async (id) => {
    const updated = await adminRepository.approveProperty(id);
    if (!updated) {
      const err = new Error("Property not found");
      err.statusCode = 404;
      throw err;
    }
    return updated;
  },

  rejectProperty: async (id, note) => {
    const updated = await adminRepository.rejectProperty(id, note);
    if (!updated) {
      const err = new Error("Property not found");
      err.statusCode = 404;
      throw err;
    }
    return updated;
  },

  // ─────────────────────────────────────────────────────────
  // REPORTS SYSTEM
  // ─────────────────────────────────────────────────────────

  createReport: async (reporterId, { targetType, targetId, reason, description }) => {
    const validTargetTypes = ["PROPERTY", "USER"];
    if (!validTargetTypes.includes(targetType)) {
      const err = new Error(`Invalid targetType. Must be one of: ${validTargetTypes.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }
    return adminRepository.createReport({ reporterId, targetType, targetId, reason, description });
  },

  listReports: async (query) => {
    const { reports, total } = await adminRepository.listReports(query);
    const { page = 1, limit = 15 } = query;
    return {
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  },

  resolveReport: async (id, status) => {
    const validStatuses = ["REVIEWING", "RESOLVED", "DISMISSED"];
    if (!validStatuses.includes(status)) {
      const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }
    return adminRepository.updateReportStatus(id, status);
  }
};
