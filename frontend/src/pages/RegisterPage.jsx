/**
 * RegisterPage — themed sign-up form with validation.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import FormField, { Input } from "../components/ui/FormField";
import Button from "../components/ui/Button";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    password_confirm: "",
    referral_code: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await register(formData);
      toast.success(res.detail || "Registration successful! Please check your email to verify your account.", { duration: 5000 });
      navigate("/login", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === "object") {
        setErrors(data);
      } else {
        setErrors({ general: "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const getError = (field) => {
    if (!errors[field]) return null;
    return Array.isArray(errors[field]) ? errors[field][0] : errors[field];
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg glow">
            <span className="text-white font-bold text-2xl">SK</span>
          </div>
          <h1 className="text-3xl font-bold theme-text mb-2">
            Create your account
          </h1>
          <p className="theme-text-secondary">
            Get started with the platform
          </p>
        </div>

        {/* Form Card */}
        <div className="card rounded-2xl p-8 shadow-xl border theme-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-4 rounded-xl border bg-danger/10 border-danger/20 text-danger text-sm">
                {errors.general}
              </div>
            )}

            <FormField label="Username" error={getError("username")} required>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" error={getError("first_name")} required>
                <Input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  required
                />
              </FormField>
              <FormField label="Last Name" error={getError("last_name")} required>
                <Input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                />
              </FormField>
            </div>

            <FormField label="Email Address" error={getError("email")} required>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </FormField>

            <FormField label={<span>Phone <span className="font-normal theme-text-muted">(optional)</span></span>}>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
              />
            </FormField>

            <FormField label="Password" error={getError("password")} required>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </FormField>

            <FormField label="Confirm Password" error={getError("password_confirm")} required>
              <Input
                name="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </FormField>

            <FormField
              label={<span>Referral Code <span className="font-normal theme-text-muted">(optional)</span></span>}
              error={getError("referral_code")}
            >
              <Input
                name="referral_code"
                value={formData.referral_code}
                onChange={handleChange}
                placeholder="Enter referral code"
              />
            </FormField>

            <Button
              type="submit"
              loading={loading}
              className="w-full text-base font-semibold py-3 mt-2"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm theme-text-muted">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
