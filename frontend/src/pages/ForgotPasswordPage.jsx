import { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import FormField, { Input } from "../components/ui/FormField";
import Button from "../components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await axiosInstance.post("/auth/forgot-password/", { email });
      setStatus("success");
      setMessage(res.data.detail || "If an account exists, a reset link has been sent.");
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.detail || "Failed to process request. Please try again.");
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
          <h1 className="text-3xl font-bold theme-text mb-2">Forgot Password</h1>
          <p className="theme-text-secondary">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Card */}
        <div className="card rounded-2xl p-8 shadow-xl border theme-border">
          {status === "success" ? (
            <div className="text-center space-y-6">
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success font-medium">
                {message}
              </div>
              <Link to="/login" className="block w-full">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "error" && (
                <div className="p-4 rounded-xl border bg-danger/10 border-danger/20 text-danger text-sm">
                  {message}
                </div>
              )}

              <FormField label="Email Address" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </FormField>

              <Button
                type="submit"
                loading={status === "loading"}
                className="w-full text-base font-semibold py-3"
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm theme-text-muted hover:theme-text transition-colors"
            >
              Remember your password? <span className="text-primary-500 font-semibold">Log in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
