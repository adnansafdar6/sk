/**
 * ProfilePage — edit username/phone, view referral code, change password.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import {
  User,
  Phone,
  Copy,
  Check,
  Lock,
  Calendar,
  Star,
  ShieldCheck,
  Save,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import useAuth from "../hooks/useAuth";
import FormField, { Input } from "../components/ui/FormField";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

// ─── VIP config ───────────────────────────────────────────────────────────────

const VIP_COLOR   = { 0: "neutral", 1: "info", 2: "warning", 3: "success" };
const VIP_LABEL   = { 0: "Regular", 1: "VIP 1", 2: "VIP 2", 3: "VIP 3" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
}

function getFieldError(err, field) {
  const v = err?.[field];
  if (!v) return null;
  return Array.isArray(v) ? v[0] : v;
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, delay = 0 }) {
  return (
    <div
      className="card rounded-2xl overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2.5 px-6 py-4 border-b theme-border">
        <Icon className="w-4 h-4 text-primary-400 shrink-0" />
        <h2 className="text-base font-semibold theme-text">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg theme-text-muted hover:text-primary-400 hover:bg-(--bg-input) transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  // ── Profile edit state ───────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    phone:    user?.phone    || "",
  });
  const [profileErrors,   setProfileErrors]   = useState({});
  const [savingProfile,   setSavingProfile]   = useState(false);

  // ── Password change state ────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    old_password:         "",
    new_password:         "",
    new_password_confirm: "",
  });
  const [pwErrors,   setPwErrors]   = useState({});
  const [savingPw,   setSavingPw]   = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleProfileChange = (e) => {
    setProfileForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (profileErrors[e.target.name])
      setProfileErrors((p) => ({ ...p, [e.target.name]: undefined }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    setSavingProfile(true);
    try {
      const res = await axiosInstance.patch("/auth/profile/", {
        username: profileForm.username,
        phone:    profileForm.phone,
      });
      if (setUser) setUser(res.data);
      toast.success("Profile updated!");
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === "object" && !data.detail) {
        setProfileErrors(data);
      } else {
        toast.error(data?.detail || "Failed to save profile.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwChange = (e) => {
    setPwForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (pwErrors[e.target.name])
      setPwErrors((p) => ({ ...p, [e.target.name]: undefined }));
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    setPwErrors({});

    if (pwForm.new_password !== pwForm.new_password_confirm) {
      setPwErrors({ new_password_confirm: "Passwords do not match." });
      return;
    }

    setSavingPw(true);
    try {
      await axiosInstance.post("/auth/change-password/", pwForm);
      setPwForm({ old_password: "", new_password: "", new_password_confirm: "" });
      toast.success("Password changed successfully!");
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === "object" && !data.detail) {
        setPwErrors(data);
      } else {
        toast.error(data?.detail || "Failed to change password.");
      }
    } finally {
      setSavingPw(false);
    }
  };

  const vipLevel = user?.vip_level ?? 0;
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold theme-text">My Profile</h1>
        <p className="text-sm theme-text-secondary mt-0.5">
          Manage your account details and security settings.
        </p>
      </div>

      <div className="space-y-5">

        {/* ── Account overview ─────────────────────────────────────── */}
        <SectionCard title="Account Overview" icon={ShieldCheck} delay={0}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shrink-0">
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>

            {/* Info grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">

              <div className="space-y-0.5">
                <p className="text-xs theme-text-muted uppercase tracking-wider font-medium">Full Name</p>
                <p className="text-sm font-semibold theme-text">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs theme-text-muted uppercase tracking-wider font-medium">Email</p>
                <p className="text-sm theme-text truncate">{user?.email}</p>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs theme-text-muted uppercase tracking-wider font-medium">Account Level</p>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <Badge color={VIP_COLOR[vipLevel]} size="sm">
                    {VIP_LABEL[vipLevel]}
                  </Badge>
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs theme-text-muted uppercase tracking-wider font-medium">Member Since</p>
                <div className="flex items-center gap-1.5 text-sm theme-text">
                  <Calendar className="w-3.5 h-3.5 theme-text-muted shrink-0" />
                  {fmtDate(user?.date_joined)}
                </div>
              </div>

              {/* Referral code */}
              <div className="sm:col-span-2 space-y-0.5">
                <p className="text-xs theme-text-muted uppercase tracking-wider font-medium">
                  Referral Code
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-primary-400 bg-primary-600/10 border border-primary-500/20 px-3 py-1 rounded-lg tracking-widest">
                    {user?.referral_code || "—"}
                  </span>
                  {user?.referral_code && <CopyButton value={user.referral_code} />}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Edit profile ─────────────────────────────────────────── */}
        <SectionCard title="Edit Profile" icon={User} delay={80}>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Username"
                error={getFieldError(profileErrors, "username")}
                helper="Your unique login handle"
              >
                <Input
                  name="username"
                  value={profileForm.username}
                  onChange={handleProfileChange}
                  placeholder="johndoe"
                  autoComplete="username"
                />
              </FormField>

              <FormField
                label="Phone Number"
                error={getFieldError(profileErrors, "phone")}
                helper="Used for alternative login"
              >
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted pointer-events-none" />
                  <Input
                    name="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="+1 234 567 890"
                    className="pl-9"
                  />
                </div>
              </FormField>
            </div>

            {profileErrors.detail && (
              <p className="text-xs text-red-400">{profileErrors.detail}</p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                loading={savingProfile}
                icon={Save}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </SectionCard>

        {/* ── Change password ───────────────────────────────────────── */}
        <SectionCard title="Change Password" icon={Lock} delay={160}>
          <form onSubmit={handlePwSave} className="space-y-4">
            <FormField
              label="Current Password"
              error={getFieldError(pwErrors, "old_password")}
              required
            >
              <Input
                name="old_password"
                type="password"
                value={pwForm.old_password}
                onChange={handlePwChange}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="New Password"
                error={getFieldError(pwErrors, "new_password")}
                required
              >
                <Input
                  name="new_password"
                  type="password"
                  value={pwForm.new_password}
                  onChange={handlePwChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </FormField>

              <FormField
                label="Confirm New Password"
                error={getFieldError(pwErrors, "new_password_confirm")}
                required
              >
                <Input
                  name="new_password_confirm"
                  type="password"
                  value={pwForm.new_password_confirm}
                  onChange={handlePwChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </FormField>
            </div>

            {pwErrors.detail && (
              <p className="text-xs text-red-400">{pwErrors.detail}</p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                loading={savingPw}
                icon={Lock}
              >
                Update Password
              </Button>
            </div>
          </form>
        </SectionCard>

      </div>
    </div>
  );
}
