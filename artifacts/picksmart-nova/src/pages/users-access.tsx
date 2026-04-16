import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAccessStore } from "@/lib/accessStore";
import { useAuthStore } from "@/lib/authStore";
import type { AuthRole } from "@/lib/authStore";
import { useTranslation } from "react-i18next";
import { Users, Shield, Key, UserPlus, Copy, Check, Mail, Share2 } from "lucide-react";

type RoleKey = "Selector" | "Trainer" | "Supervisor" | "Admin" | "User";

const roleLinks: Record<RoleKey, string> = {
  Selector: "/nova",
  Trainer: "/trainer-portal",
  Supervisor: "/supervisor",
  Admin: "/users-access",
  User: "/",
};

const roleDescriptions: Record<RoleKey, string> = {
  Selector: "selector access: Training · My Progress · Leaderboard · Common Mistakes · NOVA Trainer · Selector Nation",
  Trainer: "trainer access: Trainer Dashboard · My Selectors · Assignments · Warehouse Reference · NOVA tools",
  Supervisor: "supervisor access: Supervisor Dashboard · Live tracking · Warehouse Reference · Trainer oversight",
  Admin: "admin access: Full analytics · user management · NOVA account management",
  User: "user access: basic site access",
};

function maskPassword(password: string) {
  return "•".repeat(Math.max(password.length, 8));
}

const ROLE_BADGE: Record<string, string> = {
  Selector: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  Trainer: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  Supervisor: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  Admin: "bg-red-500/10 text-red-300 border-red-500/30",
  User: "bg-slate-700 text-slate-300 border-slate-600",
};

const AUTH_ROLES: Record<RoleKey, AuthRole | null> = {
  Selector: null,
  Trainer: "trainer",
  Supervisor: "supervisor",
  Admin: "owner",
  User: null,
};

export default function UsersAccessPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { currentUser, logout } = useAuthStore();
  const {
    appUsers, novaAccounts,
    inviteAppUser, createNovaAccount, deactivateNovaAccount,
  } = useAccessStore();

  const [inviteForm, setInviteForm] = useState({
    fullName: "John Smith",
    email: "someone@example.com",
    role: "Selector" as RoleKey,
  });

  const [accountForm, setAccountForm] = useState({
    fullName: "Jane Smith",
    username: "jane.smith",
    password: "Secure2024!",
    role: "Trainer" as "Trainer" | "Supervisor",
  });

  const [ownerPassword, setOwnerPassword] = useState("");
  const [copied, setCopied] = useState("");
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [generatedInviteName, setGeneratedInviteName] = useState("");
  const [generatedInviteEmail, setGeneratedInviteEmail] = useState("");
  const [generatedInviteRole, setGeneratedInviteRole] = useState<RoleKey>("Selector");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const inviteLink = useMemo(() => roleLinks[inviteForm.role], [inviteForm.role]);

  const allowedRoles: RoleKey[] = useMemo(() => {
    const r = currentUser?.role;
    if (r === "owner" || r === "manager") {
      return ["Selector", "Trainer", "Supervisor", "Admin"];
    }
    return ["Selector", "Trainer"];
  }, [currentUser?.role]);

  const handleSignOut = () => { logout(); navigate("/login"); };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1800);
    } catch { /* silent */ }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) return;
    inviteAppUser({ fullName: inviteForm.fullName, email: inviteForm.email, role: inviteForm.role, inviteLink });

    const authRole = AUTH_ROLES[inviteForm.role];
    const name = inviteForm.fullName.trim();
    const email = inviteForm.email.trim();
    const role = inviteForm.role;

    if (authRole) {
      try {
        const raw = localStorage.getItem("picksmart-auth-store");
        const jwt = raw ? (JSON.parse(raw) as { state?: { jwtToken?: string } })?.state?.jwtToken : null;
        const res = await fetch("/api/auth/invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          },
          body: JSON.stringify({
            fullName: name,
            email,
            role: authRole,
            warehouseId: currentUser?.warehouseId ?? null,
            warehouseSlug: currentUser?.warehouseSlug ?? null,
          }),
        });
        if (res.ok) {
          const { token } = await res.json() as { token: string };
          const url = `${window.location.origin}/invite/${token}`;
          setGeneratedInviteUrl(url);
          setGeneratedInviteName(name);
          setGeneratedInviteEmail(email);
          setGeneratedInviteRole(role);
        }
      } catch { /* silent */ }
    } else {
      setGeneratedInviteUrl(null);
    }

    setInviteForm({ fullName: "", email: "", role: "Selector" });
  };

  const handleSendEmail = async () => {
    if (!generatedInviteUrl || emailSending) return;
    setEmailSending(true);
    setEmailSent(false);
    try {
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/invites/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: generatedInviteEmail,
          name: generatedInviteName,
          role: generatedInviteRole.toLowerCase(),
          inviteUrl: generatedInviteUrl,
        }),
      });
      if (res.ok) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 5000);
      } else {
        const data = await res.json().catch(() => ({})) as { detail?: string };
        // Fallback to mailto if Resend not configured
        const subject = encodeURIComponent("You've been invited to PickSmart Academy");
        const body = encodeURIComponent(
          `Hi ${generatedInviteName},\n\nYou've been invited to join PickSmart Academy as a ${generatedInviteRole}.\n\nClick the link below to create your account:\n\n${generatedInviteUrl}\n\nSee you on the floor!\n— PickSmart Academy`
        );
        window.open(`mailto:${generatedInviteEmail}?subject=${subject}&body=${body}`, "_blank");
      }
    } catch {
      // Network error — fallback to mailto
      const subject = encodeURIComponent("You've been invited to PickSmart Academy");
      const body = encodeURIComponent(
        `Hi ${generatedInviteName},\n\nYou've been invited to join PickSmart Academy as a ${generatedInviteRole}.\n\nClick the link below to create your account:\n\n${generatedInviteUrl}\n\nSee you on the floor!\n— PickSmart Academy`
      );
      window.open(`mailto:${generatedInviteEmail}?subject=${subject}&body=${body}`, "_blank");
    } finally {
      setEmailSending(false);
    }
  };

  const handleShare = async () => {
    if (!generatedInviteUrl || !canShare) return;
    try {
      await navigator.share({
        title: "PickSmart Academy Invite",
        text: `You've been invited to PickSmart Academy as a ${generatedInviteRole}. Create your account here:`,
        url: generatedInviteUrl,
      });
    } catch { /* user cancelled */ }
  };

  const handleCreateAccount = () => {
    if (!accountForm.fullName.trim() || !accountForm.username.trim() || !accountForm.password.trim()) return;
    createNovaAccount({ fullName: accountForm.fullName, username: accountForm.username, password: accountForm.password, role: accountForm.role });
    setAccountForm({ fullName: "", username: "", password: "", role: "Trainer" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center">
                <Shield className="h-5 w-5 text-slate-950" />
              </div>
              <h1 className="text-4xl font-black">{t("usersAccess.heading")}</h1>
            </div>
            <p className="text-slate-400">
              {t("usersAccess.subtitle")}
            </p>
          </div>
        </div>

        {/* Copy toast */}
        {copied && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300 text-sm font-bold flex items-center gap-2">
            <Check className="h-4 w-4" /> Copied: {copied}
          </div>
        )}

        {/* Row 1 — Invite + App Users */}
        <div className="grid xl:grid-cols-2 gap-6">

          {/* Invite by Role */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-yellow-400" /> Invite by Role
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Full Name</label>
                <input
                  value={inviteForm.fullName}
                  onChange={(e) => setInviteForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                <input
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                  type="email"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as RoleKey }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                >
                  {allowedRoles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <p className="text-sm text-yellow-300 font-semibold leading-snug">
                  {roleDescriptions[inviteForm.role]}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-300 break-all">
                    {window.location.origin}{inviteLink}
                  </div>
                  <button
                    onClick={() => handleCopy(inviteLink, "Invite URL")}
                    className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold hover:border-yellow-400 transition flex items-center gap-2 shrink-0"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                </div>
                <p className="text-xs text-slate-500">Selectors get a platform invite email automatically.</p>
              </div>

              <button
                onClick={handleInviteUser}
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" /> Generate Invite Link
              </button>

              {generatedInviteUrl && (
                <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 mt-2 space-y-4">
                  <p className="text-green-300 text-sm font-bold flex items-center gap-2">
                    <Check className="h-4 w-4" /> Invite link ready for {generatedInviteName}
                  </p>

                  <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-300 break-all">
                    {generatedInviteUrl}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSendEmail}
                      disabled={emailSending}
                      className="flex-1 min-w-[140px] rounded-2xl bg-yellow-400 px-4 py-2.5 font-bold text-sm text-slate-950 hover:bg-yellow-300 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {emailSending ? (
                        <><span className="animate-spin inline-block h-4 w-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full" /> Sending…</>
                      ) : emailSent ? (
                        <><Check className="h-4 w-4 text-green-700" /> Email Sent!</>
                      ) : (
                        <><Mail className="h-4 w-4" /> Send Email</>
                      )}
                    </button>

                    {canShare && (
                      <button
                        onClick={handleShare}
                        className="flex-1 min-w-[120px] rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2.5 font-semibold text-sm text-white hover:border-yellow-400 transition flex items-center justify-center gap-2"
                      >
                        <Share2 className="h-4 w-4" /> Share
                      </button>
                    )}

                    <button
                      onClick={() => handleCopy(generatedInviteUrl, "Invite URL")}
                      className="flex-1 min-w-[120px] rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2.5 font-semibold text-sm text-white hover:border-yellow-400 transition flex items-center justify-center gap-2"
                    >
                      {copied === "Invite URL"
                        ? <><Check className="h-4 w-4 text-green-400" /> Copied!</>
                        : <><Copy className="h-4 w-4" /> Copy Link</>
                      }
                    </button>
                  </div>

                  <p className="text-xs text-green-400/70">
                    {emailSent
                      ? `✓ Email with QR code sent to ${generatedInviteEmail} via Resend.`
                      : `"Send Email" delivers a branded invite with QR code directly to ${generatedInviteEmail}.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* App Users */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-400" /> App Users
            </h2>

            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {appUsers.map((user) => (
                <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <h3 className="text-base font-black capitalize">{user.fullName}</h3>
                  <p className="mt-1 text-slate-400 text-sm">{user.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold border ${ROLE_BADGE[user.role] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                      {user.role}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                      user.status === "active"
                        ? "bg-green-500/10 text-green-300 border-green-500/30"
                        : user.status === "invited"
                        ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                        : "bg-slate-700 text-slate-400 border-slate-600"
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 — NOVA Accounts */}
        <div className="grid xl:grid-cols-2 gap-6">

          {/* Create NOVA Account */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
              <Key className="h-5 w-5 text-yellow-400" /> NOVA Access
            </h2>
            <p className="text-slate-400 text-sm mb-6">Trainers &amp; Supervisors</p>

            <p className="text-base font-bold mb-5">Create new account</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Full name</label>
                <input
                  value={accountForm.fullName}
                  onChange={(e) => setAccountForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Username</label>
                  <input
                    value={accountForm.username}
                    onChange={(e) => setAccountForm((p) => ({ ...p, username: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Password</label>
                  <input
                    value={accountForm.password}
                    onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Role</label>
                <select
                  value={accountForm.role}
                  onChange={(e) => setAccountForm((p) => ({ ...p, role: e.target.value as "Trainer" | "Supervisor" }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                >
                  <option>Trainer</option>
                  <option>Supervisor</option>
                </select>
              </div>

              <button
                onClick={handleCreateAccount}
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition"
              >
                Create account
              </button>

              <p className="text-xs text-slate-500 leading-relaxed">
                Trainers log in at <span className="text-slate-300">/trainer-portal</span> and supervisors at{" "}
                <span className="text-slate-300">/supervisor</span> using these credentials.
              </p>
            </div>
          </div>

          {/* Active Accounts */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-6">Active accounts</h2>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {novaAccounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black capitalize">{account.fullName}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold border ${ROLE_BADGE[account.role] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                          {account.role}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                          account.status === "active"
                            ? "bg-green-500/10 text-green-300 border-green-500/30"
                            : "bg-red-500/10 text-red-300 border-red-500/30"
                        }`}>
                          {account.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">
                        Username: <span className="text-white font-semibold">{account.username}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Password: <span className="text-white font-semibold">{maskPassword(account.password)}</span>
                      </p>
                    </div>

                    {account.status === "active" && (
                      <button
                        onClick={() => deactivateNovaAccount(account.id)}
                        className="rounded-2xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Owner Analytics */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-2">Owner Analytics</h2>
          <p className="text-slate-400 text-sm mb-6">Analytics &amp; user management</p>

          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div className="max-w-md">
              <label className="block text-sm text-slate-400 mb-2">Owner password</label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Enter Owner password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
              />
            </div>
            <Link href="/supervisor">
              <button className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition">
                Enter Supervisor Dashboard
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
