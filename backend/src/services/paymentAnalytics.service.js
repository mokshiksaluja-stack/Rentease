import { prisma } from "../config/prisma.js";
import { PAYMENT_STATUS } from "../constants/paymentStatus.js";

export const paymentAnalyticsService = {
  /**
   * Get basic financial metrics summary
   */
  getFinancialSummary: async (userId, role) => {
    const where = {};
    if (role === "LANDLORD") {
      where.landlordId = userId;
    } else if (role === "TENANT") {
      where.tenantId = userId;
    }

    // 1. Total Revenue (SUCCEEDED payments)
    const totalResult = await prisma.payment.aggregate({
      where: { ...where, status: PAYMENT_STATUS.SUCCEEDED },
      _sum: { amount: true }
    });
    const totalRevenue = Number(totalResult._sum.amount || 0);

    // 2. Pending Revenue (PENDING payments)
    const pendingResult = await prisma.payment.aggregate({
      where: { ...where, status: PAYMENT_STATUS.PENDING },
      _sum: { amount: true }
    });
    const pendingRevenue = Number(pendingResult._sum.amount || 0);

    // 3. Refunded Revenue (REFUNDED payments)
    const refundedResult = await prisma.payment.aggregate({
      where: { ...where, status: PAYMENT_STATUS.REFUNDED },
      _sum: { amount: true }
    });
    const refundedRevenue = Number(refundedResult._sum.amount || 0);

    // 4. Monthly Revenue (Current calendar month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyResult = await prisma.payment.aggregate({
      where: {
        ...where,
        status: PAYMENT_STATUS.SUCCEEDED,
        processedAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });
    const monthlyRevenue = Number(monthlyResult._sum.amount || 0);

    // 5. Recent payments list (Take last 5)
    const recentPayments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        booking: {
          select: {
            bookingReference: true,
            property: { select: { title: true } }
          }
        }
      }
    });

    return {
      totalRevenue,
      monthlyRevenue,
      pendingRevenue,
      refundedRevenue,
      recentPayments
    };
  },

  /**
   * Get monthly revenue history for the past 6 calendar months
   */
  getRevenueByMonth: async (userId, role) => {
    const where = { status: PAYMENT_STATUS.SUCCEEDED };
    if (role === "LANDLORD") {
      where.landlordId = userId;
    } else if (role === "TENANT") {
      where.tenantId = userId;
    }

    const today = new Date();
    const monthsData = [];

    // Loop back 6 months
    for (let i = 5; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const result = await prisma.payment.aggregate({
        where: {
          ...where,
          processedAt: {
            gte: start,
            lte: end
          }
        },
        _sum: { amount: true }
      });

      const label = start.toLocaleString("default", { month: "short", year: "numeric" });
      monthsData.push({
        month: label,
        revenue: Number(result._sum.amount || 0)
      });
    }

    return monthsData;
  }
};
