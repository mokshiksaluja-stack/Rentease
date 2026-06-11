import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * Route protection wrapper component.
 * Restricts route rendering to authenticated users, with optional role checks.
 * 
 * @param {React.ReactNode} children - The page component to render if approved
 * @param {Array<string>} allowedRoles - Array of roles permitted (e.g. ["ADMIN", "LANDLORD"])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. If context state is loading, render a premium skeleton loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        {/* Animated loader */}
        <div className="w-12 h-12 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin"></div>
        <p className="text-sm text-slate-400 font-light">Loading secure session credentials...</p>
      </div>
    );
  }

  // 2. If user is unauthenticated, redirect to the auth page, preserving their attempted path
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. If route checks roles and user does not match the list
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // We run the notification inside a useEffect to avoid setting state during component rendering
    return <UnauthorizedRedirect />;
  }

  // 4. Render matching child component if all checks pass
  return children;
};

// Helper redirect component to trigger alerts safely
const UnauthorizedRedirect = () => {
  useEffect(() => {
    toast.error("Access Denied: You do not have permission to view that page.");
  }, []);
  
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
