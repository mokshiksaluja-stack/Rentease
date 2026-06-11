import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Home } from "lucide-react";

const AuthLayout = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 overflow-hidden px-4">
      {/* Premium background glowing decoration circles */}
      
      

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Logo and Home Navigation link */}
        <Link to="/" className="flex items-center space-x-2 mb-8 group">
          <div className="p-2.5 bg-brand-600 rounded-2xl shadow-sm">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-100">
            RentEase
          </span>
        </Link>

        {/* Centered Glassmorphic login/registration card wrapper */}
        <div className="w-full glass-card rounded-3xl p-8 border border-slate-700 shadow-2xl relative">
          <Outlet />
        </div>

        {/* Navigation fallback link */}
        <Link to="/" className="mt-6 text-sm text-slate-400 hover:text-brand-600 transition-colors duration-200">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
};

export default AuthLayout;
