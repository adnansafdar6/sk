/**
 * usePermission — RBAC helpers for the frontend.
 */
import useAuth from "./useAuth";

export default function usePermission() {
  const { roles, permissions } = useAuth();

  /** Check if user has ANY of the given roles. */
  const hasRole = (...requiredRoles) =>
    requiredRoles.some((r) => roles.includes(r));

  /** Check if user has ALL the given permissions. */
  const hasPermission = (...requiredPerms) =>
    requiredPerms.every((p) => permissions.includes(p));

  /** Check if user has ANY of the given permissions. */
  const hasAnyPermission = (...perms) =>
    perms.some((p) => permissions.includes(p));

  /** Check if user is an admin. */
  const isAdmin = roles.includes("admin");

  /** Check if user is a manager or admin. */
  const isManagerOrAbove = roles.includes("admin") || roles.includes("manager");

  return {
    roles,
    permissions,
    hasRole,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isManagerOrAbove,
  };
}
