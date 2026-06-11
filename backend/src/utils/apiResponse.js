// RentEase Unified API Response Wrapper
// Standardizes the response structure to keep frontend parsing uniform and consistent.

class ApiResponse {
  /**
   * @param {number} statusCode - HTTP Status code (e.g. 200, 201, 400, 403, 500)
   * @param {string} message - User-friendly message explaining results
   * @param {Object} [data] - Optional payload container
   */
  constructor(statusCode, message = "Success", data = null) {
    this.status = statusCode < 400 ? "success" : "error";
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }

  /**
   * Directly dispatch response using Express response object
   */
  send(res) {
    return res.status(this.statusCode).json(this);
  }
}

export { ApiResponse };
