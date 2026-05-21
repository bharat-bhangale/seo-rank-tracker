import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { settingsApi } from "@/lib/settingsApi";
import {
  User,
  Lock,
  CreditCard,
  Bell,
  Shield,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";

type SettingsTab = "profile" | "password" | "subscription" | "notifications" | "danger";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { user } = useAuthStore();

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "password" as const, label: "Password", icon: Lock },
    { id: "subscription" as const, label: "Subscription", icon: CreditCard },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "danger" as const, label: "Danger Zone", icon: Shield },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary-50 text-primary-700"
                      : "text-surface-700 hover:bg-surface-100"
                  } ${tab.id === "danger" ? "!text-danger-500 hover:!bg-red-50" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && <ProfileSection />}
          {activeTab === "password" && <PasswordSection />}
          {activeTab === "subscription" && <SubscriptionSection user={user} />}
          {activeTab === "notifications" && <NotificationsSection />}
          {activeTab === "danger" && <DangerSection />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const updateProfile = useMutation({
    mutationFn: () => settingsApi.updateProfile({ name, email }),
    onSuccess: () => toast.success("Profile updated successfully"),
    onError: (err: any) => toast.error(err.response?.data?.error || "Update failed"),
  });

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-surface-900 mb-4">Profile Information</h2>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="label">Avatar</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-700 text-xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <button className="btn btn-ghost text-sm">Change Avatar</button>
          </div>
        </div>
        <div>
          <label className="label">Full Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Email Address</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          onClick={() => updateProfile.mutate()}
          disabled={updateProfile.isPending}
          className="btn btn-primary"
        >
          {updateProfile.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePassword = useMutation({
    mutationFn: () => settingsApi.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Password change failed"),
  });

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = currentPassword && newPassword.length >= 8 && passwordsMatch;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-surface-900 mb-4">Change Password</h2>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="label">Current Password</label>
          <input
            type="password"
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {newPassword && newPassword.length < 8 && (
            <p className="error-text">Password must be at least 8 characters</p>
          )}
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            className={`input ${confirmPassword && !passwordsMatch ? "input-error" : ""}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword && !passwordsMatch && (
            <p className="error-text">Passwords do not match</p>
          )}
        </div>
        <button
          onClick={() => changePassword.mutate()}
          disabled={!canSubmit || changePassword.isPending}
          className="btn btn-primary"
        >
          {changePassword.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          Change Password
        </button>
      </div>
    </div>
  );
}

function SubscriptionSection({ user }: { user: any }) {
  const plan = user?.subscription?.plan || "free";
  const limits = user?.subscription || {};

  const plans = [
    {
      name: "Free",
      price: "$0",
      features: ["10 keywords", "2 websites", "5 audits/day", "100 crawl pages"],
      current: plan === "free",
    },
    {
      name: "Pro",
      price: "$29/mo",
      features: ["500 keywords", "20 websites", "50 audits/day", "10K crawl pages"],
      current: plan === "pro",
    },
    {
      name: "Enterprise",
      price: "$99/mo",
      features: ["5,000 keywords", "100 websites", "500 audits/day", "100K crawl pages"],
      current: plan === "enterprise",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Usage Meters */}
      <div className="card">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Current Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageMeter label="Keywords" used={0} limit={limits.keywordLimit || 10} />
          <UsageMeter label="Websites" used={0} limit={limits.websiteLimit || 2} />
          <UsageMeter label="Daily Audits" used={0} limit={limits.dailyAuditLimit || 5} />
          <UsageMeter label="Crawl Pages" used={0} limit={limits.crawlPageLimit || 100} />
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`card ${p.current ? "border-primary-300 ring-2 ring-primary-100" : ""}`}
          >
            <h3 className="font-semibold text-surface-900">{p.name}</h3>
            <p className="text-2xl font-bold text-surface-900 my-2">{p.price}</p>
            <ul className="space-y-1 text-sm text-surface-600">
              {p.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            {p.current ? (
              <span className="inline-block mt-3 text-xs font-medium text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
                Current Plan
              </span>
            ) : (
              <button className="btn btn-primary mt-3 w-full text-sm">
                Upgrade
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const color = percentage >= 90 ? "bg-danger-500" : percentage >= 70 ? "bg-warning-500" : "bg-primary-600";

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-surface-600">{label}</span>
        <span className="font-medium text-surface-900">
          {used}/{limit}
        </span>
      </div>
      <div className="w-full bg-surface-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [rankChanges, setRankChanges] = useState(true);
  const [auditComplete, setAuditComplete] = useState(true);
  const [backlinkAlerts, setBacklinkAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-surface-900 mb-4">Notification Preferences</h2>
      <div className="space-y-4 max-w-md">
        <ToggleRow label="Email Notifications" description="Receive alerts via email" checked={emailAlerts} onChange={setEmailAlerts} />
        <ToggleRow label="Rank Changes" description="Alert on position changes ±5" checked={rankChanges} onChange={setRankChanges} />
        <ToggleRow label="Audit Complete" description="When SEO audits finish" checked={auditComplete} onChange={setAuditComplete} />
        <ToggleRow label="Backlink Alerts" description="New or lost backlinks" checked={backlinkAlerts} onChange={setBacklinkAlerts} />
        <ToggleRow label="Weekly Digest" description="Summary email every Monday" checked={weeklyDigest} onChange={setWeeklyDigest} />
        <button className="btn btn-primary">
          <Save className="h-4 w-4" />
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-surface-900">{label}</p>
        <p className="text-xs text-surface-500">{description}</p>
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
          checked ? "bg-primary-600" : "bg-surface-300"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </div>
    </label>
  );
}

function DangerSection() {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteAccount = useMutation({
    mutationFn: () => settingsApi.deleteAccount(),
    onSuccess: () => {
      toast.success("Account deleted");
      window.location.href = "/login";
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Deletion failed"),
  });

  return (
    <div className="card border-danger-500 border">
      <h2 className="text-lg font-semibold text-danger-500 mb-2 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Danger Zone
      </h2>
      <p className="text-sm text-surface-600 mb-4">
        Once you delete your account, there is no going back. All your data will be permanently removed.
      </p>
      {!confirmDelete ? (
        <button onClick={() => setConfirmDelete(true)} className="btn bg-danger-500 text-white hover:bg-red-600">
          Delete Account
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-danger-500">
            Are you absolutely sure? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => deleteAccount.mutate()}
              disabled={deleteAccount.isPending}
              className="btn bg-danger-500 text-white hover:bg-red-600"
            >
              {deleteAccount.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Yes, Delete My Account
            </button>
            <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
