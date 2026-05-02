import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import FormField, { Input } from "../components/ui/FormField";
import Button from "../components/ui/Button";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    new_password: "",
    new_password_confirm: "",
  });
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.new_password_confirm) {
        setStatus("error");
        setMessage("Passwords do not match.");
        return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await axiosInstance.post("/auth/reset-password/", { 
          token,
          new_password: formData.new_password,
          new_password_confirm: formData.new_password_confirm
      });
      setStatus("success");
      setMessage(res.data.detail || "Password has been reset successfully.");
    } catch (err) {
      setStatus("error");
      const errData = err.response?.data;
      
      let errMsg = "Failed to reset password.";
      if (errData?.detail) errMsg = errData.detail;
      else if (errData?.new_password) errMsg = errData.new_password[0];
      else if (errData?.token) errMsg = "Invalid or expired reset link.";
      
      setMessage(errMsg);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in-up">
        <div className="w-full max-w-md card rounded-2xl p-8 border theme-border shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-warning/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-warning/30">
            <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold theme-text">Invalid Link</h2>
          <p className="theme-text-secondary">No reset token provided. Please use the link from your email.</p>
          <Link to="/forgot-password" className="block w-full">
            <Button className="w-full py-3">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg glow">
            <span className="text-white font-bold text-2xl">SK</span>
          </div>
          <h1 className="text-3xl font-bold theme-text mb-2">Create New Password</h1>
          <p className="theme-text-secondary">
            Please enter your new password below.
          </p>
        </div>

        <div className="card rounded-2xl p-8 shadow-xl border theme-border">
          {status === "success" ? (
            <div className="text-center space-y-6">
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success font-medium">
                {message}
              </div>
              <Button onClick={() => navigate("/login")} className="w-full py-3">
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "error" && (
                <div className="p-4 rounded-xl border bg-danger/10 border-danger/20 text-danger text-sm">
                  {message}
                </div>
              )}

              <FormField label="New Password" required>
                <Input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </FormField>

              <FormField label="Confirm New Password" required>
                <Input
                  type="password"
                  name="new_password_confirm"
                  value={formData.new_password_confirm}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </FormField>

              <Button
                type="submit"
                loading={status === "loading"}
                className="w-full text-base font-semibold py-3"
              >
                Reset Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
