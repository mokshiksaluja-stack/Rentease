import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Public Authentication Endpoints
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

router.get("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Protected Authentication Endpoints
router.post("/change-password", authenticate, authController.changePassword);

export default router;
