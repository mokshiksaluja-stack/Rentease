import { adminService } from "../services/admin.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AdminUserDTO, AdminPropertyDTO, AdminReportDTO } from "../dtos/admin.dto.js";

export const adminController = {
  // ─────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────

  getDashboard: async (req, res, next) => {
    try {
      const data = await adminService.getDashboardStats();
      new ApiResponse(200, "Dashboard analytics loaded", data).send(res);
    } catch (err) {
      next(err);
    }
  },

  // ─────────────────────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────────────────────

  listUsers: async (req, res, next) => {
    try {
      const { page, limit, role, search, isSuspended } = req.query;
      const result = await adminService.listUsers({ page, limit, role, search, isSuspended });
      new ApiResponse(200, "Users list loaded", {
        users: AdminUserDTO.fromEntities(result.users),
        pagination: result.pagination
      }).send(res);
    } catch (err) {
      next(err);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await adminService.getUserProfile(id);
      new ApiResponse(200, "User profile loaded", AdminUserDTO.fromEntity(user)).send(res);
    } catch (err) {
      next(err);
    }
  },

  suspendUser: async (req, res, next) => {
    try {
      const adminId = req.user.id;
      const { id } = req.params;
      await adminService.suspendUser(adminId, id);
      new ApiResponse(200, "User account suspended successfully").send(res);
    } catch (err) {
      next(err);
    }
  },

  activateUser: async (req, res, next) => {
    try {
      const adminId = req.user.id;
      const { id } = req.params;
      await adminService.activateUser(adminId, id);
      new ApiResponse(200, "User account activated successfully").send(res);
    } catch (err) {
      next(err);
    }
  },

  // ─────────────────────────────────────────────────────────
  // PROPERTY MODERATION
  // ─────────────────────────────────────────────────────────

  listProperties: async (req, res, next) => {
    try {
      const { page, limit, isApproved, search, city } = req.query;
      const result = await adminService.listProperties({ page, limit, isApproved, search, city });
      new ApiResponse(200, "Properties list loaded", {
        properties: AdminPropertyDTO.fromEntities(result.properties),
        pagination: result.pagination
      }).send(res);
    } catch (err) {
      next(err);
    }
  },

  approveProperty: async (req, res, next) => {
    try {
      const { id } = req.params;
      const property = await adminService.approveProperty(id);
      new ApiResponse(200, "Property approved and listed successfully", AdminPropertyDTO.fromEntity(property)).send(res);
    } catch (err) {
      next(err);
    }
  },

  rejectProperty: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const property = await adminService.rejectProperty(id, note);
      new ApiResponse(200, "Property rejected", AdminPropertyDTO.fromEntity(property)).send(res);
    } catch (err) {
      next(err);
    }
  },

  // ─────────────────────────────────────────────────────────
  // REPORTS SYSTEM
  // ─────────────────────────────────────────────────────────

  createReport: async (req, res, next) => {
    try {
      const reporterId = req.user.id;
      const { targetType, targetId, reason, description } = req.body;
      const report = await adminService.createReport(reporterId, { targetType, targetId, reason, description });
      new ApiResponse(201, "Report submitted successfully", AdminReportDTO.fromEntity(report)).send(res);
    } catch (err) {
      next(err);
    }
  },

  listReports: async (req, res, next) => {
    try {
      const { page, limit, status, targetType } = req.query;
      const result = await adminService.listReports({ page, limit, status, targetType });
      new ApiResponse(200, "Reports list loaded", {
        reports: AdminReportDTO.fromEntities(result.reports),
        pagination: result.pagination
      }).send(res);
    } catch (err) {
      next(err);
    }
  },

  resolveReport: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const report = await adminService.resolveReport(id, status);
      new ApiResponse(200, `Report status updated to ${status}`, AdminReportDTO.fromEntity(report)).send(res);
    } catch (err) {
      next(err);
    }
  }
};
