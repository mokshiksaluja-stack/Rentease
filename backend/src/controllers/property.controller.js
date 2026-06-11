import { propertyService } from "../services/property.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { propertySchema } from "../validators/property.validator.js";

class PropertyController {
  /**
   * 1. POST /api/v1/properties
   * Create a new property listing (Landlords only)
   */
  createProperty = asyncHandler(async (req, res) => {
    // Run Zod validation schema on body parameters
    const validatedData = propertySchema.parse(req.body);
    
    // Extract uploaded files from Multer array mapping
    const files = req.files || [];

    const property = await propertyService.createProperty(
      validatedData,
      files,
      req.user.id // Landlord ID bound by the authentication middleware
    );

    res.status(201).json({
      status: "success",
      message: "Property listing created successfully",
      data: { property }
    });
  });

  /**
   * 2. GET /api/v1/properties
   * Retrieve all properties (supports advanced filters, sorting, and pagination queries)
   */
  getAllProperties = asyncHandler(async (req, res) => {
    const { properties, totalResults, page, limit, totalPages } = 
      await propertyService.getAllProperties(req.query);

    res.status(200).json({
      status: "success",
      pagination: {
        page,
        limit,
        totalPages,
        totalResults
      },
      data: { properties }
    });
  });

  /**
   * 3. GET /api/v1/properties/:id
   * Retrieve property details by ID
   */
  getPropertyById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(id);

    res.status(200).json({
      status: "success",
      data: { property }
    });
  });

  /**
   * 4. PATCH /api/v1/properties/:id
   * Update property listing details
   */
  updateProperty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Run Zod validation schema on update fields
    const validatedData = propertySchema.parse(req.body);
    const files = req.files || [];

    const property = await propertyService.updateProperty(
      id,
      validatedData,
      files,
      req.user.id
    );

    res.status(200).json({
      status: "success",
      message: "Property listing updated successfully",
      data: { property }
    });
  });

  /**
   * 5. DELETE /api/v1/properties/:id
   * Remove property listing
   */
  deleteProperty = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await propertyService.deleteProperty(id, req.user.id);

    res.status(200).json({
      status: "success",
      message: "Property listing deleted successfully"
    });
  });

  /**
   * 6. GET /api/v1/properties/nearby
   * Fetch listings within a specific radius of coordinates
   */
  getNearbyProperties = asyncHandler(async (req, res) => {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      const err = new Error("Latitude (lat) and longitude (lng) are required query parameters");
      err.statusCode = 400;
      throw err;
    }

    const properties = await propertyService.getNearbyProperties(lat, lng, radius);

    res.status(200).json({
      status: "success",
      results: properties.length,
      data: { properties }
    });
  });
}

export const propertyController = new PropertyController();
