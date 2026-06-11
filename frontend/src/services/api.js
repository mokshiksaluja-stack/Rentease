import axios from "axios";

// 1. Create a centralized Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5005/api/v1",
  timeout: 10000, // Timeout after 10 seconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  },
  withCredentials: true // Send cookies automatically along with requests (critical for JWT refresh tokens)
});

let accessToken = "";

/**
 * Updates the in-memory access token used by the Axios client.
 * Called by AuthContext during login, logout, and token refresh.
 */
export const setAccessToken = (token) => {
  accessToken = token;
};

// 2. Request Interceptor: Intercept requests before they are sent
api.interceptors.request.use(
  (config) => {
    // If we have an access token in memory, automatically inject it into headers
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    if (import.meta.env.DEV) {
      console.log(`📡 [API Request]: Sending ${config.method?.toUpperCase()} to ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent infinite retry loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 3. Response Interceptor: Intercept responses before they are returned to components
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ [API Response]: ${response.config.method?.toUpperCase()} ${response.config.url} completed successfully`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Standardize error responses before passing them to React Query
    const formattedError = {
      status: "error",
      message: error.response?.data?.message || error.message || "An unexpected error occurred",
      statusCode: error.response?.status || 500,
      details: error.response?.data || null
    };

    // If we receive a 401 Unauthorized and this request has not been retried yet
    if (formattedError.statusCode === 401 && !originalRequest._retry) {
      // If we are already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (import.meta.env.DEV) {
          console.log("🔄 [Axios Interceptor]: 401 Intercepted. Attempting silent session refresh...");
        }
        
        // Trigger silent refresh API call. Cookies are sent automatically
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5005/api/v1"}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        
        // Update local variable and queue
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        if (import.meta.env.DEV) {
          console.warn("🔄 [Axios Interceptor]: Session refresh failed. Clearing token.");
        }
        setAccessToken(""); // Clear local token
        
        // Broadcast custom event so AuthContext knows it must redirect to login
        window.dispatchEvent(new Event("auth:session-expired"));

        return Promise.reject(formattedError);
      }
    }

    if (import.meta.env.DEV) {
      console.error(`❌ [API Error]:`, formattedError);
    }

    return Promise.reject(formattedError);
  }
);

export default api;
