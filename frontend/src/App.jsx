import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

// Import Layouts
import MainLayout from "./layouts/MainLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

// Import Pages
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import PropertyDashboard from "./pages/PropertyDashboard.jsx";
import PropertyFormPage from "./pages/PropertyFormPage.jsx";
import PropertyDetailPage from "./pages/PropertyDetailPage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import BookingDashboard from "./pages/BookingDashboard.jsx";
import BookingHistoryPage from "./pages/BookingHistoryPage.jsx";
import BookingDetailPage from "./pages/BookingDetailPage.jsx";
import ConversationPage from "./pages/ConversationPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import PaymentHistoryPage from "./pages/PaymentHistoryPage.jsx";
import PaymentDetailPage from "./pages/PaymentDetailPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import AdminPropertiesPage from "./pages/AdminPropertiesPage.jsx";
import AdminReportsPage from "./pages/AdminReportsPage.jsx";

// Import Providers & Guards
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// 1. Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent background refetching when user switches browser tabs
      retry: 1, // Retry failed network queries once before showing error
      staleTime: 5 * 60 * 1000, // Consider fetched data fresh for 5 minutes
    },
  },
});



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Main Layout Group (Navbar + Footer) */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="explore" element={<ExplorePage />} />
              
              {/* Public Property Detail View */}
              <Route path="properties/:id" element={<PropertyDetailPage />} />
              
              {/* Protected Landlord Property Management Routes */}
              <Route
                path="properties"
                element={
                  <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                    <PropertyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="properties/create"
                element={
                  <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                    <PropertyFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="properties/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                    <PropertyFormPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected Booking Routes */}
              <Route
                path="dashboard/bookings"
                element={
                  <ProtectedRoute allowedRoles={["TENANT", "LANDLORD", "ADMIN"]}>
                    <BookingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/bookings/history"
                element={
                  <ProtectedRoute allowedRoles={["TENANT", "LANDLORD", "ADMIN"]}>
                    <BookingHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/bookings/:id"
                element={
                  <ProtectedRoute allowedRoles={["TENANT", "LANDLORD", "ADMIN"]}>
                    <BookingDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/bookings/messages/:id"
                element={
                  <ProtectedRoute allowedRoles={["TENANT", "LANDLORD", "ADMIN"]}>
                    <ConversationPage />
                  </ProtectedRoute>
                }
              />

              {/* Payment Routes */}
              <Route
                path="dashboard/payments/pay/:bookingId"
                element={
                  <ProtectedRoute allowedRoles={["TENANT"]}>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/payments/history"
                element={
                  <ProtectedRoute allowedRoles={["TENANT", "LANDLORD", "ADMIN"]}>
                    <PaymentHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/payments/:id"
                element={
                  <ProtectedRoute allowedRoles={["TENANT", "LANDLORD", "ADMIN"]}>
                    <PaymentDetailPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Auth Layout Group (Centered Glass Card Layout) */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route index element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
            </Route>

            {/* Protected Admin Layout Group */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="properties" element={<AdminPropertiesPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
            </Route>

            {/* Wildcard Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>

      {/* Global Toaster Alerts */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "glass-card text-slate-100 border border-slate-700 rounded-xl",
          duration: 4000,
          style: {
            background: "rgba(2, 6, 23, 0.9)",
            color: "#f8fafc"
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff"
            }
          }
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
