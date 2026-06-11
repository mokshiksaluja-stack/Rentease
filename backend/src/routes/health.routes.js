import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";

const router = Router();

// Define route path: GET /
router.get("/", healthController.getHealth);

export default router;
