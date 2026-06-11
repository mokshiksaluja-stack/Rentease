import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import api from "../services/api.js";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("Verification token is missing from the URL link.");
        return;
      }

      try {
        await api.get(`/auth/verify-email?token=${token}`);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage(err.message || "Invalid or expired email verification token.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="text-center space-y-6">
      {/* 1. Verifying loading state */}
      {status === "verifying" && (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
          <h2 className="text-xl font-bold text-slate-100">Verifying Email</h2>
          <p className="text-sm text-slate-400 font-light">Confirming credentials on the server...</p>
        </div>
      )}

      {/* 2. Success state */}
      {status === "success" && (
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <CheckCircle className="w-16 h-16 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-100">Verification Complete</h2>
          <p className="text-sm text-slate-400 font-light max-w-xs mx-auto leading-relaxed">
            Your email has been verified. You can now access full platform booking services.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="btn-primary w-full max-w-xs mt-4 py-2.5"
          >
            Go to Login
          </button>
        </div>
      )}

      {/* 3. Error state */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <XCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-xl font-bold text-slate-100">Verification Failed</h2>
          <p className="text-sm text-red-400 max-w-xs mx-auto leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={() => navigate("/")}
            className="btn-secondary w-full max-w-xs mt-4 py-2.5"
          >
            Return to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyEmailPage;
