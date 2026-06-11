import { healthRepository } from "../repositories/health.repository.js";

class HealthService {
  /**
   * Evaluates system health and prepares details.
   */
  async checkHealth() {
    const diagnostics = await healthRepository.getSystemDiagnostics();
    
    // Evaluate if the system is considered healthy based on diagnostics
    const isHealthy = diagnostics.databaseConnected && diagnostics.systemMemoryFree > 1024 * 1024; // > 1MB free

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      details: {
        uptimeSeconds: Math.round(diagnostics.uptime),
        platform: diagnostics.platform,
        dbStatus: diagnostics.databaseConnected ? "connected" : "disconnected",
        processMemoryMb: Math.round(diagnostics.memoryUsage.heapUsed / 1024 / 1024)
      }
    };
  }
}

export const healthService = new HealthService();
