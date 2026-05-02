/**
 * AuthContext — global auth state with login, register, logout.
 * Also stores user roles and permissions from the RBAC system.
 */
import { createContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  getAccessToken,
  setTokens,
  clearTokens,
  isTokenExpired,
} from "../utils/tokenService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Load user on mount ──────────────────────
  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setLoading(false);
      return;
    }
    try {
      const [profileRes, rbacRes] = await Promise.all([
        axiosInstance.get("/auth/profile/"),
        axiosInstance.get("/rbac/my-permissions/"),
      ]);
      setUser(profileRes.data);
      setRoles(rbacRes.data.roles || []);
      setPermissions(rbacRes.data.permissions || []);
    } catch {
      clearTokens();
      setUser(null);
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ─── Register ────────────────────────────────
  const register = async (data) => {
    const res = await axiosInstance.post("/auth/register/", data);
    if (res.data.tokens) {
      setTokens(res.data.tokens.access, res.data.tokens.refresh);
      setUser(res.data.user);
      // Load roles/permissions after registration
      try {
        const rbacRes = await axiosInstance.get("/rbac/my-permissions/");
        setRoles(rbacRes.data.roles || []);
        setPermissions(rbacRes.data.permissions || []);
      } catch {
        // Default role may not be set yet
      }
    }
    return res.data;
  };

  // ─── Login ───────────────────────────────────
  const login = async (identifier, password) => {
    const res = await axiosInstance.post("/auth/login/", { identifier, password });
    setTokens(res.data.tokens.access, res.data.tokens.refresh);
    setUser(res.data.user);
    setRoles(res.data.roles || []);
    setPermissions(res.data.permissions || []);
    return res.data;
  };

  // ─── Logout ──────────────────────────────────
  const logout = async () => {
    try {
      const refresh = localStorage.getItem("sk_refresh_token");
      if (refresh) {
        await axiosInstance.post("/auth/logout/", { refresh });
      }
    } catch {
      // continue to clear
    }
    clearTokens();
    setUser(null);
    setRoles([]);
    setPermissions([]);
  };

  // ─── Update profile ──────────────────────────
  const updateProfile = async (data) => {
    const res = await axiosInstance.patch("/auth/profile/", data);
    setUser(res.data);
    return res.data;
  };

  const value = {
    user,
    roles,
    permissions,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
