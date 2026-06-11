import { Router } from "express";
import { propertyController } from "../controllers/property.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// Public Read Endpoints (No authentication required to search/view listings)
router.get("/", propertyController.getAllProperties);
router.get("/nearby", propertyController.getNearbyProperties); // Registered BEFORE /:id to avoid parameter hijacking
router.get("/:id", propertyController.getPropertyById);

// Protected Modifying Endpoints (Requires Landlord authorization)
router.post(
  "/",
  authenticate,
  authorize("LANDLORD", "ADMIN"),
  upload.array("images", 10), // Intercept form-data, max 10 files allowed under key 'images'
  propertyController.createProperty
);

router.patch(
  "/:id",
  authenticate,
  authorize("LANDLORD", "ADMIN"),
  upload.array("images", 10),
  propertyController.updateProperty
);

router.delete(
  "/:id",
  authenticate,
  authorize("LANDLORD", "ADMIN"),
  propertyController.deleteProperty
);

export default router;
