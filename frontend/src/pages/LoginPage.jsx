import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

// 1. Define frontend Zod validation schema
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address format" }),
  
  password: z
    .string()
    .min(1, { message: "Password is required" })
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Identify where the user came from (redirect destination after login)
  const from = location.state?.from?.pathname || "/";

  // 2. Initialize React Hook Form with Zod schema resolver
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true }); // Redirect back to original target page
    } catch (err) {
      setSubmitError(err.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-100">Welcome Back</h2>
        <p className="text-sm text-slate-400 mt-1.5 font-light">Sign in to your RentEase account</p>
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
        {/* Email Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="email"
              placeholder="name@example.com"
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <Link to="/auth/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Forgot Password?
            </Link>
          </div>
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-3 mt-2 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Switch Form Trigger */}
      <div className="text-center text-xs text-slate-500">
        Don't have an account?{" "}
        <Link to="/auth/register" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
          Create Account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
