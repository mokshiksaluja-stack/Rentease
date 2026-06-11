import { prisma } from "../config/prisma.js";

class UserRepository {
  /**
   * Find a user by their email address.
   * @param {string} email 
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Find a user by their UUID.
   * @param {string} id 
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Create a new user record in the database.
   * @param {Object} userData 
   */
  async create(userData) {
    return prisma.user.create({
      data: userData
    });
  }

  /**
   * Update specific user fields (e.g. password resets, verification flags).
   * @param {string} id 
   * @param {Object} updateData 
   */
  async update(id, updateData) {
    return prisma.user.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Find a user by their password reset token.
   * @param {string} token 
   */
  async findByResetToken(token) {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date() // Must be greater than current time (not expired)
        }
      }
    });
  }

  /**
   * Find a user by their email verification token.
   * @param {string} token 
   */
  async findByVerificationToken(token) {
    return prisma.user.findFirst({
      where: {
        verificationToken: token
      }
    });
  }
}

export const userRepository = new UserRepository();
