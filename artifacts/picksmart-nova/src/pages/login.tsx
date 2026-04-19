import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import type { AuthRole } from "@/lib/authStore";
import { Activity, Eye, EyeOff, Lock } from "lucide-react";

const ROLE_HOME: Record<AuthRole, string> = {
  selector: "/selector",
  trainer: "/trainer-portal",
  supervisor: "/supervisor",
  manager: "/supervisor",
  director: "/command",
  owner: "/command",
};

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { loginAsync } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect") || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 400));

    const ok = await loginAsync(username.trim(), password);
    setLoading(false);

    if (ok) {
      const { currentUser } = useAuthStore.getState();
      const dest = redirect || (currentUser ? ROLE_HOME[currentUser.role] : "/");
      navigate(dest);
    } else {
      setError("Incorrect username or password. Please try again.");
    }
  };

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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
              <Lock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Sign in</h1>
              <p className="text-slate-400 text-sm">PickSmart NOVA — Staff &amp; Selector access</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                placeholder="Enter your username"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-400">Password</label>
                <Link href="/forgot">
                  <span className="text-xs text-yellow-400 hover:text-yellow-300 transition cursor-pointer">
                    Forgot password?
                  </span>
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-800 flex items-center justify-center gap-1 text-sm text-slate-500">
            Can't sign in?
            <Link href="/forgot">
              <span className="text-slate-400 hover:text-yellow-400 transition cursor-pointer ml-1">
                Recover your username or password →
              </span>
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-slate-600 text-sm">
          PickSmart Academy &mdash; Staff &amp; Selector access
        </p>
      </div>
    </div>
  );
}
