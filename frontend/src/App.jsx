/**
 * App.jsx — root component with nested layout routes.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";

// Route guards
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import RoleRoute from "./routes/RoleRoute";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";

// Public / Auth Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Client Pages
import HomePage from "./pages/HomePage";
import UserDashboardPage from "./pages/UserDashboardPage";
import TaskCenterPage from "./pages/TaskCenterPage";
import WithdrawalPage from "./pages/WithdrawalPage";
import ProfilePage from "./pages/ProfilePage";
import VIPPage from "./pages/VIPPage";
import SupportPage from "./pages/SupportPage";

// Admin Pages
import DashboardPage from "./pages/DashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminTasksPage from "./pages/AdminTasksPage";
import AdminWithdrawalsPage from "./pages/AdminWithdrawalsPage";
import AdminRolesPage from "./pages/AdminRolesPage";
import AdminPermissionsPage from "./pages/AdminPermissionsPage";
import AdminAuditLogsPage from "./pages/AdminAuditLogsPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminMemberStoriesPage from "./pages/AdminMemberStoriesPage";
import AdminPlansPage from "./pages/AdminPlansPage";
import AdminPaymentWalletsPage from "./pages/AdminPaymentWalletsPage";
import AdminPurchasesPage from "./pages/AdminPurchasesPage";
import PlanPaymentPage from "./pages/PlanPaymentPage";

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const isAdminOrManager = ["admin", "manager"].includes(user?.role);

  return (
    <Routes>
      {/* ─── Auth Pages (no layout) ──────────── */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* ─── Client Layout ───────────────────── */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TaskCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <WithdrawalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vip"
          element={
            <ProtectedRoute>
              <VIPPage />
            </ProtectedRoute>
          }
        />
        <Route path="/support" element={<SupportPage />} />
        <Route
          path="/payment/:planId"
          element={
            <ProtectedRoute>
              <PlanPaymentPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ─── Admin Layout (role-gated) ───────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["admin", "manager"]}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="tasks" element={<AdminTasksPage />} />
        <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
        <Route path="roles" element={<RoleRoute roles={["admin"]}><AdminRolesPage /></RoleRoute>} />
        <Route path="permissions" element={<RoleRoute roles={["admin"]}><AdminPermissionsPage /></RoleRoute>} />
        <Route path="categories" element={<RoleRoute roles={["admin"]}><AdminCategoriesPage /></RoleRoute>} />
        <Route path="logs" element={<RoleRoute roles={["admin"]}><AdminAuditLogsPage /></RoleRoute>} />
        <Route path="member-stories" element={<RoleRoute roles={["admin"]}><AdminMemberStoriesPage /></RoleRoute>} />
        <Route path="plans" element={<RoleRoute roles={["admin"]}><AdminPlansPage /></RoleRoute>} />
        <Route path="payment-wallets" element={<RoleRoute roles={["admin"]}><AdminPaymentWalletsPage /></RoleRoute>} />
        <Route path="purchases" element={<RoleRoute roles={["admin"]}><AdminPurchasesPage /></RoleRoute>} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* ─── Catch-all ───────────────────────── */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? (isAdminOrManager ? "/admin" : "/dashboard") : "/"}
            replace
          />
        }
      />
    </Routes>
  );
}
