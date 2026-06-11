import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

// 1. Zod Registration validation schema (must match backend rules)
const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters long" }),
  
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address format" }),
  
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Must contain at least one number" }),
  
  role: z.enum(["TENANT", "LANDLORD"])
});

const RegisterPage = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState("TENANT");

  // 2. Initialize React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "TENANT"
    }
  });

  // Handle custom role selection buttons
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setValue("role", role);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await signup(data.name, data.email, data.password, data.role);
      navigate("/auth"); // Redirect to login page upon success
    } catch (err) {
      setSubmitError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-100">Create Account</h2>
        <p className="text-sm text-slate-400 mt-1.5 font-light">Join the RentEase property network</p>
      </div>

      {/* API Submission Error Banner */}
      {submitError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center space-x-2 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Alex Mercer"
              {...register("name")}
              className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors ${
                errors.name ? "border-red-500/50 focus:border-red-500" : "border-slate-700"
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="email"
              placeholder="alex@example.com"
              {...register("email")}
              className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors ${
                errors.email ? "border-red-500/50 focus:border-red-500" : "border-slate-700"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors ${
                errors.password ? "border-red-500/50 focus:border-red-500" : "border-slate-700"
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Role Selection Buttons */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registering As</label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => handleRoleSelect("TENANT")}
              className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                selectedRole === "TENANT"
                  ? "bg-brand-600/10 border-brand-500 text-brand-400 shadow-md"
                  : "bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              Tenant
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("LANDLORD")}
              className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                selectedRole === "LANDLORD"
                  ? "bg-brand-600/10 border-brand-500 text-brand-400 shadow-md"
                  : "bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              Landlord
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-3 mt-4 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      {/* Switch Form Trigger */}
      <div className="text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link to="/auth" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
