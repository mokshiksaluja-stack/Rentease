import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { userRepository } from "../repositories/user.repository.js";

class AuthService {
  /**
   * Helper: Generate JWT Access Token.
   * @param {Object} user 
   */
  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
    );
  }

  /**
   * Helper: Generate JWT Refresh Token.
   * @param {Object} user 
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
    );
  }

  /**
   * Helper: Generate random cryptographic token strings (used for email verify & reset passwords).
   */
  generateCryptoToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * 1. Register a new user.
   */
  async register(name, email, password, role) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const err = new Error("User with this email already exists");
      err.statusCode = 400;
      throw err;
    }

    // Hash password with bcrypt (rounds = 10 is standard balance of speed/security)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = this.generateCryptoToken();

    // Create user record
    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
      verificationToken
    });

    // In a real production system, you would call a mailer service here.
    // For local development, we print the verification link to the console:
    console.log(`=========================================`);
    console.log(`✉️ [Mail Simulation]: Verification Link for ${email}`);
    console.log(`🔗 Link: http://localhost:5173/verify-email?token=${verificationToken}`);
    console.log(`=========================================`);

    // Remove sensitive data (like password) before returning user object
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 2. Log in a user.
   */
  async login(email, password) {
    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Save tokens or do other updates if necessary (e.g. logging login timestamps)
    
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  /**
   * 3. Refresh Access Token (Token Rotation Pattern).
   */
  async refreshSession(token) {
    try {
      // Verify refresh token signature
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      
      // Find matching user
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        const err = new Error("User not found");
        err.statusCode = 401;
        throw err;
      }

      // Generate new tokens (Rotation)
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      const err = new Error("Invalid or expired session token");
      err.statusCode = 401;
      throw err;
    }
  }

  /**
   * 4. Verify Email Token.
   */
  async verifyEmail(token) {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      const err = new Error("Invalid or expired email verification token");
      err.statusCode = 400;
      throw err;
    }

    // Mark verified and clear verification token
    await userRepository.update(user.id, {
      isEmailVerified: true,
      verificationToken: null
    });

    return true;
  }

  /**
   * 5. Forgot Password.
   */
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    // For security, do not leak that a user doesn't exist. Just return success
    if (!user) return true;

    // Generate reset token and set expiry (1 hour from now)
    const resetToken = this.generateCryptoToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: expiry
    });

    // Simulate sending email
    console.log(`=========================================`);
    console.log(`✉️ [Mail Simulation]: Password Reset link for ${email}`);
    console.log(`🔗 Link: http://localhost:5173/reset-password?token=${resetToken}`);
    console.log(`=========================================`);

    return true;
  }

  /**
   * 6. Reset Password.
   */
  async resetPassword(token, newPassword) {
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      const err = new Error("Reset token is invalid or has expired");
      err.statusCode = 400;
      throw err;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token fields
    await userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    return true;
  }

  /**
   * 7. Change Password (Authenticated users).
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      const err = new Error("Incorrect current password");
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.update(userId, { password: hashedPassword });

    return true;
  }
}

export const authService = new AuthService();
