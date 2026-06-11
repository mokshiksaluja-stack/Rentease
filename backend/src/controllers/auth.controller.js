import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from "../validators/auth.validator.js";

// Cookie configurations (Secure HTTP-Only same-site policies)
const getCookieOptions = () => ({
  httpOnly: true, // Prevents client-side scripts from reading the cookie (protects against XSS)
  secure: process.env.NODE_ENV === "production", // Only transmit cookie over HTTPS in production
  sameSite: "lax", // Protects against Cross-Site Request Forgery (CSRF)
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching token lifespan
});

class AuthController {
  /**
   * 1. POST /api/v1/auth/register
   */
  register = asyncHandler(async (req, res) => {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password, role } = validatedData;

    const user = await authService.register(name, email, password, role);

    res.status(201).json({
      status: "success",
      message: "Registration successful. Please verify your email address.",
      data: { user }
    });
  });

  /**
   * 2. POST /api/v1/auth/login
   */
  login = asyncHandler(async (req, res) => {
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    
    const { user, accessToken, refreshToken } = await authService.login(
      validatedData.email,
      validatedData.password
    );

    // Set refresh token inside a secure, HTTP-only cookie
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user,
        accessToken
      }
    });
  });

  /**
   * 3. POST /api/v1/auth/refresh-token
   */
  refreshToken = asyncHandler(async (req, res) => {
    // Extract token from incoming cookies
    const clientRefreshToken = req.cookies?.refreshToken;
    if (!clientRefreshToken) {
      const err = new Error("No session token provided");
      err.statusCode = 401;
      throw err;
    }

    const { user, accessToken, refreshToken } = await authService.refreshSession(clientRefreshToken);

    // Rotate refresh cookie
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    res.status(200).json({
      status: "success",
      message: "Session token refreshed",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken
      }
    });
  });

  /**
   * 4. POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    // Clear the secure cookie by setting expiry to past date
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });

    res.status(200).json({
      status: "success",
      message: "Logout successful"
    });
  });

  /**
   * 5. GET /api/v1/auth/verify-email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) {
      const err = new Error("Verification token is missing");
      err.statusCode = 400;
      throw err;
    }

    await authService.verifyEmail(token);

    res.status(200).json({
      status: "success",
      message: "Email verified successfully. You can now log in."
    });
  });

  /**
   * 6. POST /api/v1/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const validatedData = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(validatedData.email);

    res.status(200).json({
      status: "success",
      message: "If a matching account exists, a password reset link has been generated."
    });
  });

  /**
   * 7. POST /api/v1/auth/reset-password
   */
  resetPassword = asyncHandler(async (req, res) => {
    const validatedData = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(validatedData.token, validatedData.password);

    res.status(200).json({
      status: "success",
      message: "Password reset successful. You can now log in with your new password."
    });
  });

  /**
   * 8. POST /api/v1/auth/change-password (Authenticated only)
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      const err = new Error("Current and new passwords are required");
      err.statusCode = 400;
      throw err;
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      status: "success",
      message: "Password changed successfully"
    });
  });
}

export const authController = new AuthController();
