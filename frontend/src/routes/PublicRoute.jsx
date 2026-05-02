/**
 * PublicRoute — redirects authenticated users to their role-appropriate home.
 * Admin / manager → /admin
 * Regular users   → /dashboard
 */
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

export default function PublicRoute({ children }) {
  const { isAuthenticated, loading, roles } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (isAuthenticated) {
    const isAdminOrManager =
      roles.includes("admin") || roles.includes("manager");
    return <Navigate to={isAdminOrManager ? "/admin" : "/dashboard"} replace />;
  }

  return children;
}
