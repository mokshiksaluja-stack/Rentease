import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// ─── Dashboard ────────────────────────────────────────────
router.get("/dashboard", authorize("ADMIN"), adminController.getDashboard);

// ─── User Management ──────────────────────────────────────
router.get("/users", authorize("ADMIN"), adminController.listUsers);
router.get("/users/:id", authorize("ADMIN"), adminController.getUserById);
router.patch("/users/:id/suspend", authorize("ADMIN"), adminController.suspendUser);
router.patch("/users/:id/activate", authorize("ADMIN"), adminController.activateUser);

// ─── Property Moderation ──────────────────────────────────
router.get("/properties", authorize("ADMIN"), adminController.listProperties);
router.patch("/properties/:id/approve", authorize("ADMIN"), adminController.approveProperty);
router.patch("/properties/:id/reject", authorize("ADMIN"), adminController.rejectProperty);

// ─── Reports ──────────────────────────────────────────────
// createReport: any authenticated user can report a listing or user
router.post("/reports", adminController.createReport);
// listReports + resolveReport: admin only
router.get("/reports", authorize("ADMIN"), adminController.listReports);
router.patch("/reports/:id/resolve", authorize("ADMIN"), adminController.resolveReport);

export default router;
