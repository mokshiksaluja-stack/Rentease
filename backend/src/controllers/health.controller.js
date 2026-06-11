import { healthService } from "../services/health.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class HealthController {
  /**
   * GET /api/v1/health
   * Responds with system health status.
   */
  getHealth = asyncHandler(async (req, res) => {
    const healthReport = await healthService.checkHealth();
    
    res.status(200).json({
      status: "success",
      message: "Server is healthy and operational",
      data: healthReport
    });
  });
}

export const healthController = new HealthController();
