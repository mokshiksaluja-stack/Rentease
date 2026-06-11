import jwt from "jsonwebtoken";

/**
 * Authentication Gate: Verifies the JWT Access Token in the request headers.
 */
export const authenticate = (req, res, next) => {
  // 1. Extract the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Authentication required. Please log in.");
    err.statusCode = 401;
    return next(err); // Forward the error to our global error middleware
  }

  // 2. Extract the token string
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verify the token signature
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // 4. Attach the decoded payload (user ID, email, role) to the request object
    req.user = decoded;
    
    // 5. Pass control to the next middleware/controller
    next();
  } catch (error) {
    const err = new Error("Invalid or expired session token. Please log in again.");
    err.statusCode = 401;
    next(err);
  }
};

/**
 * Authorization Gate: Restricts access to specific user roles.
 * Must be registered AFTER the authenticate middleware.
 * 
 * @param {...string} allowedRoles - The roles permitted to access the route
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by the authenticate middleware
    if (!req.user) {
      const err = new Error("Authentication required");
      err.statusCode = 401;
      return next(err);
    }

    // Verify if user role is within allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      const err = new Error("Access denied. You do not have permission to view this resource.");
      err.statusCode = 403; // Forbidden
      return next(err);
    }

    next();
  };
};
