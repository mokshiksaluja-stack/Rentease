import React, { useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Home, Compass, User, Info, Mail, Shield, LogOut, Calendar, Building, MessageSquare } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { socketService } from "../services/socket.service.js";
import { useSocketNotificationSync } from "../hooks/useNotifications.js";
import NotificationDropdown from "../components/notifications/NotificationDropdown.jsx";

const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Initialize socket notification synchronization hooks
  useSocketNotificationSync(user?.id);

  // Manage global socket connection lifecycle based on user session
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        socketService.connect(token);
      }
    } else {
      socketService.disconnect();
    }

    return () => {
      // Don't disconnect immediately on minor re-renders, but clean up on final unmount
    };
  }, [isAuthenticated, user?.id]);

  const handleLogout = async () => {
    socketService.disconnect();
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Premium Glassmorphism Navigation Bar */}
      <header className="glass-navbar sticky top-0 z-50 w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-brand-600 rounded-xl shadow-sm group-hover:rotate-3 transition-all duration-300">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-100 group-hover:text-brand-600 transition-colors duration-200">
              RentEase
            </span>
          </Link>
 
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/explore" className="text-sm font-medium text-slate-300 hover:text-brand-600 transition-colors duration-200 flex items-center space-x-1">
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </Link>

            {isAuthenticated && (
              <Link to="/dashboard/bookings" className="text-sm font-medium text-slate-300 hover:text-brand-600 transition-colors duration-200 flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Bookings</span>
              </Link>
            )}

            {isAuthenticated && (
              <Link to="/dashboard/bookings?tab=messages" className="text-sm font-medium text-slate-300 hover:text-brand-600 transition-colors duration-200 flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </Link>
            )}

            {isAuthenticated && (user?.role === "LANDLORD" || user?.role === "ADMIN") && (
              <Link to="/properties" className="text-sm font-medium text-slate-300 hover:text-brand-600 transition-colors duration-200 flex items-center space-x-1">
                <Building className="w-4 h-4" />
                <span>My Listings</span>
              </Link>
            )}

            {!isAuthenticated && (
              <>
                <a href="#features" className="text-sm font-medium text-slate-300 hover:text-brand-600 transition-colors duration-200 flex items-center space-x-1">
                  <Info className="w-4 h-4" />
                  <span>Features</span>
                </a>
                <a href="#contact" className="text-sm font-medium text-slate-300 hover:text-brand-600 transition-colors duration-200 flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </a>
              </>
            )}
          </nav>

          {/* Action Button */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Real-time Notifications Bell Dropdown */}
                <NotificationDropdown userId={user?.id} />

                <span className="text-xs text-slate-400 font-medium hidden sm:inline bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
                  {user?.name} ({user?.role})
                </span>
                
                {user?.role === "ADMIN" && (
                  <Link to="/admin" className="btn-primary py-2 px-4 text-sm flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Admin Portal</span>
                  </Link>
                )}

                <button 
                  onClick={handleLogout}
                  className="btn-secondary py-2 px-4 text-sm flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn-secondary py-2 px-4 text-sm flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link to="/admin" className="btn-primary py-2 px-4 text-sm flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Admin Portal</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Dynamic Viewport Page Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Premium Footer */}
      <footer id="contact" className="border-t border-slate-700 bg-slate-800 px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-brand-600 rounded-lg">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-100">RentEase</span>
            </div>
            <p className="text-sm text-slate-400">
              Transforming the property rental experience through secure transactions and real-time operations.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-200 mb-4 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-brand-600 transition-colors">Browse Properties</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Pricing Structure</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Trust & Safety</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-200 mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-brand-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Press Room</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-200 mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-brand-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-700 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} RentEase Inc. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed for ultimate property matching.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
