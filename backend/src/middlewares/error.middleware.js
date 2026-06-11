/**
 * Global Express error handling middleware.
 * Intercepts all next(error) calls, determines the appropriate status code,
 * and responds with a uniform JSON object.
 */
const errorMiddleware = (err, req, res, next) => {
  // 1. Establish the status code (default to 500 Internal Server Error)
  const statusCode = err.statusCode || 500;
  
  // 2. Establish the message (default to server error message)
  const message = err.message || "Internal Server Error";

  // 3. Format the error response object
  const response = {
    status: "error",
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  };

  // 4. Log the error to the console (in development only to keep logs clean in test environments)
  if (process.env.NODE_ENV === "development") {
    console.error(`[Error Middleware]: ${message}`, err.stack);
  }

  // 5. Send JSON response
  res.status(statusCode).json(response);
};

export { errorMiddleware };
