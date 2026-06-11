import { z } from "zod";

// 1. Register input validation schema
export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address format" }),
  
  password: z
    .string({ required_error: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  
  role: z
    .enum(["TENANT", "LANDLORD"], {
      errorMap: () => ({ message: "Role must be either TENANT or LANDLORD" })
    })
    .default("TENANT")
});

// 2. Login input validation schema
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address format" }),
  
  password: z
    .string({ required_error: "Password is required" })
    .min(1, { message: "Password cannot be blank" })
});

// 3. Forgot Password schema
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address format" })
});

// 4. Reset Password schema
export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: "Verification token is required" })
    .min(1, { message: "Token cannot be empty" }),
  
  password: z
    .string({ required_error: "Password is required" })
    .min(6, { message: "New password must be at least 6 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
});
