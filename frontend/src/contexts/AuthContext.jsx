import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import api, { setAccessToken } from "../services/api.js";

// 1. Create the React Context
const AuthContext = createContext(null);

/**
 * Custom hook to easily consume the AuthContext inside components.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Provider component wrapping the React tree to inject auth states.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: Clear authentication state locally
  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken("");
  };

  // 1. Silent Refresh on App Mount: Restore session if valid refresh cookie exists
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ping refresh endpoint
        const response = await api.post("/auth/refresh-token");
        const { user: userData, accessToken } = response.data?.data;
        
        setUser(userData);
        setAccessToken(accessToken);
        setIsAuthenticated(true);
      } catch (err) {
        // Silent catch: if no refresh cookie exists or token is invalid, user is unauthenticated
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to session expiration events broadcasted by Axios interceptors
    const handleSessionExpired = () => {
      clearAuthState();
      toast.error("Your session has expired. Please log in again.");
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, []);

  // 2. User Login Action
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user: userData, accessToken } = response.data?.data;

      setUser(userData);
      setAccessToken(accessToken);
      setIsAuthenticated(true);
      
      toast.success(`Welcome back, ${userData.name}!`);
      return userData;
    } catch (err) {
      toast.error(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 3. User Register Action
  const register = async (name, email, password, role) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", { name, email, password, role });
      toast.success(response.data?.message || "Registration successful! Please check your email.");
      return response.data;
    } catch (err) {
      toast.error(err.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 4. User Logout Action
  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post("/auth/logout");
      clearAuthState();
      toast.success("Successfully logged out");
    } catch (err) {
      toast.error("Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
