/**
 * AdminSettingsPage — two panels: platform settings + admin personal profile.
 */
import { useState, useEffect } from "react";
import { Save, RefreshCw, Settings, User } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import useAuth from "../hooks/useAuth";

// ─── Field meta (matches MANAGED_SETTINGS on the backend) ────────────────────

const SETTING_FIELDS = [
  { key: "platform_name",         label: "Platform Name",                type: "text",     placeholder: "EarnSK" },
  { key: "hero_title",            label: "Landing Hero Title",           type: "text",     placeholder: "Get paid daily in USDT crypto" },
  { key: "hero_subtitle",         label: "Landing Hero Subtitle",        type: "textarea", placeholder: "Complete easy tasks…" },
  { key: "whatsapp_link",         label: "WhatsApp Support Link",        type: "text",     placeholder: "https://wa.me/1234567890" },
  { key: "welcome_bonus_amount",  label: "Welcome Bonus Amount (USDT)",  type: "number",   placeholder: "0" },
  { key: "min_withdrawal_amount", label: "Min Withdrawal Amount (USDT)", type: "number",   placeholder: "10" },
];

// ─── Input helpers ────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium theme-text-secondary mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-xl text-sm theme-text bg-(--bg-input) border theme-border focus:outline-none focus:border-primary-500 transition-colors";

// ─── Platform Settings Panel ──────────────────────────────────────────────────

function PlatformSettingsPanel() {
  const [values,  setValues]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/wallet/admin/settings/");
      const map = {};
      res.data.forEach((s) => { map[s.key] = s.value; });
      setValues(map);
    } catch {
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.post("/wallet/admin/settings/", values);
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card rounded-2xl overflow-hidden animate-fade-in-up">
      <div className="flex items-center justify-between px-6 py-4 border-b theme-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary-400" />
          </div>
          <h2 className="text-base font-semibold theme-text">Platform Settings</h2>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg theme-text-muted hover:theme-text hover:bg-(--bg-input) transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <form onSubmit={save} className="p-6 space-y-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-24 rounded bg-(--bg-input) animate-pulse" />
              <div className="h-9 w-full rounded-xl bg-(--bg-input) animate-pulse" />
            </div>
          ))
        ) : (
          SETTING_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === "textarea" ? (
                <textarea
                  value={values[f.key] ?? ""}
                  onChange={set(f.key)}
                  rows={3}
                  placeholder={f.placeholder}
                  className={`${inputCls} resize-none`}
                />
              ) : (
                <input
                  type={f.type}
                  value={values[f.key] ?? ""}
                  onChange={set(f.key)}
                  placeholder={f.placeholder}
                  step={f.type === "number" ? "0.01" : undefined}
                  min={f.type === "number" ? "0" : undefined}
                  className={inputCls}
                />
              )}
            </Field>
          ))
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Personal Profile Panel ───────────────────────────────────────────────────

function PersonalProfilePanel() {
  const { user, updateProfile } = useAuth();

  const [profile, setProfile] = useState({
    first_name: user?.first_name || "",
    last_name:  user?.last_name  || "",
    phone:      user?.phone      || "",
    bio:        user?.bio        || "",
  });
  const [passwords, setPasswords] = useState({
    old_password:         "",
    new_password:         "",
    new_password_confirm: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw,      setSavingPw]      = useState(false);

  const setP  = (k) => (e) => setProfile((prev)    => ({ ...prev, [k]: e.target.value }));
  const setPw = (k) => (e) => setPasswords((prev)   => ({ ...prev, [k]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profile);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.new_password_confirm) {
      toast.error("Passwords do not match."); return;
    }
    if (passwords.new_password.length < 8) {
      toast.error("Password must be at least 8 characters."); return;
    }
    setSavingPw(true);
    try {
      await axiosInstance.post("/auth/change-password/", passwords);
      toast.success("Password changed.");
      setPasswords({ old_password: "", new_password: "", new_password_confirm: "" });
    } catch (err) {
      const d = err.response?.data;
      toast.error(d?.old_password?.[0] || d?.new_password?.[0] || d?.detail || "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Profile info */}
      <div className="card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "50ms" }}>
        <div className="flex items-center gap-2.5 px-6 py-4 border-b theme-border">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-base font-semibold theme-text">Personal Info</h2>
        </div>
        <form onSubmit={saveProfile} className="p-6 space-y-4">
          <Field label="Email">
            <input value={user?.email || ""} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name">
              <input value={profile.first_name} onChange={setP("first_name")} className={inputCls} />
            </Field>
            <Field label="Last Name">
              <input value={profile.last_name} onChange={setP("last_name")} className={inputCls} />
            </Field>
          </div>
          <Field label="Phone">
            <input value={profile.phone} onChange={setP("phone")} placeholder="+1 234 567 890" className={inputCls} />
          </Field>
          <Field label="Bio">
            <textarea value={profile.bio} onChange={setP("bio")} rows={2} className={`${inputCls} resize-none`} />
          </Field>
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="px-6 py-4 border-b theme-border">
          <h2 className="text-base font-semibold theme-text">Change Password</h2>
        </div>
        <form onSubmit={savePassword} className="p-6 space-y-4">
          {[
            { k: "old_password",         label: "Current Password" },
            { k: "new_password",         label: "New Password" },
            { k: "new_password_confirm", label: "Confirm New Password" },
          ].map(({ k, label }) => (
            <Field key={k} label={label}>
              <input
                type="password"
                value={passwords[k]}
                onChange={setPw(k)}
                placeholder="••••••••"
                required
                className={inputCls}
              />
            </Field>
          ))}
          <button
            type="submit"
            disabled={savingPw}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium theme-text bg-(--bg-input) border theme-border hover:bg-(--bg-card-hover) disabled:opacity-50 transition-colors cursor-pointer"
          >
            {savingPw ? "Changing…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold theme-text">Settings</h1>
        <p className="text-sm theme-text-secondary mt-0.5">
          Configure platform settings and your personal profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PlatformSettingsPanel />
        <PersonalProfilePanel />
      </div>
    </div>
  );
}
