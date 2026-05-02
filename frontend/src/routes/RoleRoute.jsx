/**
 * RoleRoute — role/permission gate with access-denied fallback.
 */
import { Navigate } from "react-router-dom";
import usePermission from "../hooks/usePermission";

export default function RoleRoute({
  children,
  roles = [],
  permissions = [],
  fallback = "/dashboard",
}) {
  const { hasRole, hasPermission } = usePermission();

  const hasRequiredRole = roles.length === 0 || hasRole(...roles);
  const hasRequiredPermission =
    permissions.length === 0 || hasPermission(...permissions);

  if (!hasRequiredRole || !hasRequiredPermission) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
