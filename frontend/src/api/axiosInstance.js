/**
 * Axios instance with JWT interceptors.
 * - Request: attaches access token (skipped for login / register endpoints)
 * - Response: on 401 → attempts silent refresh, then retries
 */
import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../utils/tokenService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Endpoints that must never receive an Authorization header.
// Sending an expired/invalid token to these causes DRF's JWTAuthentication
// to raise AuthenticationFailed (401) before AllowAny is even evaluated.
const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register", "/wallet/public/", "/plans/public/"];

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor ──────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const isPublic = PUBLIC_ENDPOINTS.some((ep) => config.url?.includes(ep));
    if (!isPublic) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor (silent refresh) ────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const redirectToLogin = () => {
  clearTokens();
  window.location.href = "/login";
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh for public auth endpoints or already-retried requests.
    const isPublic = PUBLIC_ENDPOINTS.some((ep) => originalRequest.url?.includes(ep));
    const isRefreshEndpoint = originalRequest.url?.includes("/auth/token/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublic &&
      !isRefreshEndpoint
    ) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh resolves.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        setTokens(data.access, data.refresh || refreshToken);
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
