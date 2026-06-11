/**
 * Wraps asynchronous Express route handlers to automatically catch errors
 * and forward them to the global error middleware.
 * 
 * @param {Function} requestHandler - The async route/controller function
 * @returns {Function} - Standard Express middleware function
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
