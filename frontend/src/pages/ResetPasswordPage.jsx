import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Save, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api.js";

// Zod Schema
const resetSchema = z.object({
  token: z.string().min(1, { message: "Reset token is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Must contain at least one number" })
});

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  // Extract the reset token from URL parameters
  const tokenFromUrl = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: tokenFromUrl
    }
  });

  // Keep Zod token value synced if URL changes
  useEffect(() => {
    if (tokenFromUrl) {
      setValue("token", tokenFromUrl);
    }
  }, [tokenFromUrl, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await api.post("/auth/reset-password", {
        token: data.token,
        password: data.password
      });
      setSuccess(true);
      toast.success("Password reset successful!");
    } catch (err) {
      setSubmitError(err.message || "Failed to reset password. Token may be invalid or expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-100">Create New Password</h2>
        <p className="text-sm text-slate-400 mt-1.5 font-light">
          Set your new account credentials
        </p>
      </div>

      {success ? (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center text-xs text-emerald-400">
            <CheckCircle className="w-8 h-8 mb-2" />
            <p className="font-semibold text-sm">Reset Complete</p>
            <p className="mt-1 font-light text-center leading-relaxed">
              Your password has been changed. You can now log in with your new credentials.
            </p>
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="btn-primary w-full py-2.5"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <>
          {submitError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center space-x-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Display Token Status warning if missing from URL */}
            {!tokenFromUrl && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reset Token</label>
                <input
                  type="text"
                  placeholder="Paste your reset token here"
                  {...register("token")}
                  className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors ${
                    errors.token ? "border-red-500/50" : "border-slate-700"
                  }`}
                />
                {errors.token && (
                  <p className="text-xs text-red-400 mt-1">{errors.token.message}</p>
                )}
              </div>
            )}

            {/* New Password Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 mt-2 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Password</span>
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ResetPasswordPage;
