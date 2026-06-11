import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Mail, Send, AlertCircle, CheckCircle } from "lucide-react";
import api from "../services/api.js";

// Zod Schema
const forgotSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address format" })
});

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotSchema)
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMsg("");
    try {
      const response = await api.post("/auth/forgot-password", { email: data.email });
      setSuccessMsg(response.data?.message || "Password reset token successfully generated!");
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-100">Reset Password</h2>
        <p className="text-sm text-slate-400 mt-1.5 font-light">
          Enter your email to receive a password reset token
        </p>
      </div>

      {/* Success banner */}
      {successMsg ? (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center text-xs text-emerald-400">
            <CheckCircle className="w-8 h-8 mb-2" />
            <p className="font-semibold text-sm">Token Generated Successfully</p>
            <p className="mt-1.5 font-light text-center leading-relaxed">
              If a matching account exists, we have generated a reset link. Check your **terminal console logs** to copy the token!
            </p>
          </div>
          <Link to="/auth" className="btn-primary inline-block py-2.5 px-6 text-sm">
            Go to Login
          </Link>
        </div>
      ) : (
        <>
          {/* Submission error banner */}
          {submitError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center space-x-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 mt-2 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Reset Token</span>
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
