/**
 * LoginPage — premium themed login form.
 */
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import axiosInstance from "../api/axiosInstance";
import FormField, { Input } from "../components/ui/FormField";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // `from` is set by ProtectedRoute when an unauthenticated user tries to access a
  // protected page. We only honour it if it's an admin path for admin users, or a
  // non-admin path for regular users — otherwise we fall back to the role default.
  const from = location.state?.from?.pathname;

  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState(""); // idle, loading, success, error
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail(false);
    setResendStatus("");
    setLoading(true);
    try {
      const data = await login(formData.identifier, formData.password);

      const isAdminOrManager =
        data.roles?.includes("admin") || data.roles?.includes("manager");

      // Role-based default destination
      const defaultPath = isAdminOrManager ? "/admin" : "/dashboard";

      // Honour the `from` redirect only when it makes sense for the user's role:
      //   - Admin/manager: allow redirect back into /admin/* paths
      //   - Regular users: allow redirect back into any non-admin path
      // In all other cases fall back to the role default.
      let redirectPath = defaultPath;
      if (from && from !== "/login" && from !== "/register") {
        const fromIsAdminPath = from.startsWith("/admin");
        if (isAdminOrManager || !fromIsAdminPath) {
          redirectPath = from;
        }
      }

      navigate(redirectPath, { replace: true });
    } catch (err) {
      if (err.response?.data?.code === "email_unverified") {
        setUnverifiedEmail(true);
      }
      setError(
        err.response?.data?.detail || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus("loading");
    try {
      await axiosInstance.post("/auth/resend-verification/", { email: formData.identifier });
      setResendStatus("success");
      setError("Verification link sent! Please check your email.");
      setUnverifiedEmail(false);
    } catch (err) {
      setResendStatus("error");
      setError(err.response?.data?.detail || "Failed to resend link. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg glow">
            <span className="text-white font-bold text-2xl">SK</span>
          </div>
          <h1 className="text-3xl font-bold theme-text mb-2">Welcome back</h1>
          <p className="theme-text-secondary">Sign in to your account to continue</p>
        </div>

        {/* Form Card */}
        <div className="card rounded-2xl p-8 shadow-xl border theme-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className={`p-4 rounded-xl border text-sm ${
                resendStatus === "success" 
                  ? "bg-success/10 border-success/20 text-success" 
                  : "bg-danger/10 border-danger/20 text-danger"
              }`}>
                {error}
                
                {unverifiedEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResend}
                    disabled={resendStatus === "loading"}
                    className="mt-3 w-full"
                  >
                    {resendStatus === "loading" ? "Sending..." : "Resend Verification Link"}
                  </Button>
                )}
              </div>
            )}

            <FormField label="Email / Username / Phone">
              <Input
                name="identifier"
                type="text"
                required
                value={formData.identifier}
                onChange={handleChange}
                placeholder="you@example.com or johndoe"
              />
            </FormField>

            <FormField 
              label={
                <div className="flex items-center justify-between w-full">
                  <span>Password</span>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              }
            >
              <Input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </FormField>

            <Button
              type="submit"
              loading={loading}
              className="w-full text-base font-semibold py-3"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm theme-text-muted">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
