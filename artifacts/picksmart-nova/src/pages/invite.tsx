import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import type { AuthRole } from "@/lib/authStore";
import { Activity, Eye, EyeOff, UserPlus, AlertTriangle } from "lucide-react";

const ROLE_HOME: Record<AuthRole, string> = {
  selector: "/selector",
  trainer: "/trainer-portal",
  supervisor: "/supervisor",
  manager: "/supervisor",
  owner: "/users-access",
};

const ROLE_LABEL: Record<AuthRole, string> = {
  selector: "Selector",
  trainer: "Trainer",
  supervisor: "Supervisor",
  manager: "Manager",
  owner: "Owner",
};

export default function InvitePage() {
  const [, params] = useRoute("/invite/:token");
  const [, navigate] = useLocation();
  const { getInvite, acceptInvite } = useAuthStore();

  const token = params?.token ?? "";
  const invite = getInvite(token);

  // Auto-derive a clean username from the email address (before the @)
  const suggestedUsername = invite
    ? invite.email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "")
    : "";

  const [username, setUsername] = useState(suggestedUsername);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!invite) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-red-500/30 bg-slate-900 p-10 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Invalid invite</h1>
          <p className="text-slate-400">This invite link has already been used or does not exist.</p>
        </div>
      </div>
    );
  }

  if (done) {
    const home = ROLE_HOME[invite.role];
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-green-500/30 bg-slate-900 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Account created!</h1>
          <p className="text-slate-400 mb-6">Your account is ready. Sign in to get started.</p>
          <button
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(home)}`)}
            className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition"
          >
            Go to Sign in
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const ok = acceptInvite(token, username.trim(), password);
    setLoading(false);

    if (ok) {
      setDone(true);
    } else {
      setError("That username is already taken. Please choose another.");
    }
  };

  const roleLabel = ROLE_LABEL[invite.role] ?? invite.role;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="bg-yellow-400 text-slate-950 p-2 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            PickSmart <span className="text-yellow-400">NOVA</span>
          </span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white">Create your account</h1>
            <p className="text-slate-400 text-sm mt-1">
              You were invited as a <span className="text-yellow-300 font-bold">{roleLabel}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 mb-6">
            <p className="text-white font-bold capitalize">{invite.fullName}</p>
            <p className="text-slate-400 text-sm">{invite.email}</p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Choose a username
                {suggestedUsername && (
                  <span className="ml-2 text-xs text-yellow-400 font-normal">
                    — suggested from your email
                  </span>
                )}
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. john.smith"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                This is what you'll type into NOVA Trainer to start your session.
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Create a password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password || !confirm}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
