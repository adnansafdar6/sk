import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/ui/Button";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const verifyEmail = async () => {
      try {
        const res = await axiosInstance.post("/auth/verify-email/", { token });
        setStatus("success");
        setMessage(res.data.detail || "Your email has been successfully verified! You can now log in.");
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.detail || 
          "Failed to verify email. The link may be invalid or expired. Please request a new one."
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in-up">
      <div className="w-full max-w-md card rounded-2xl p-8 border theme-border shadow-xl text-center space-y-6">
        
        {status === "verifying" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full border-4 theme-border border-t-primary-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold theme-text">Verifying your email...</h2>
            <p className="theme-text-secondary">Please wait while we confirm your email address.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-success/30">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold theme-text">Email Verified!</h2>
            <p className="theme-text-secondary">{message}</p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full py-3"
            >
              Go to Login
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-danger/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-danger/30">
              <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold theme-text">Verification Failed</h2>
            <p className="theme-text-secondary">{message}</p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full py-3"
              >
                Back to Login
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
