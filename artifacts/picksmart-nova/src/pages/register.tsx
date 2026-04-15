import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { Activity, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [, navigate]   = useLocation();
  const { createAccount, login, updateSubscription } = useAuthStore();

  const params  = new URLSearchParams(window.location.search);
  const plan    = params.get("plan") || "personal";
  const savedEmail = sessionStorage.getItem("psn_checkout_email") || "";

  const [fullName,   setFullName]   = useState("");
  const [email,      setEmail]      = useState(savedEmail);
  const [username,   setUsername]   = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!fullName.trim())                               e.fullName = "Full name is required.";
    if (!email.includes("@"))                           e.email    = "Enter a valid email address.";
    if (username.trim().length < 3)                     e.username = "Username must be at least 3 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))      e.username = "Username can only contain letters, numbers, and underscores.";
    if (password.length < 8)                            e.password = "Password must be at least 8 characters.";
    if (password !== confirm)                           e.confirm  = "Passwords do not match.";

    // Check if username already taken
    const taken = useAuthStore.getState().accounts.some(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (taken) e.username = "That username is already taken. Try another.";

    return e;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    await new Promise((r) => setTimeout(r, 500));

    try {
      // Create the account
      createAccount({
        username:  username.trim(),
        password,
        fullName:  fullName.trim(),
        role:      "selector",
      });

      // Log them in immediately
      const ok = login(username.trim(), password);
      if (!ok) throw new Error("Login failed after registration.");

      // Mark as subscribed on the personal plan
      updateSubscription("personal");

      // Clear checkout session data
      sessionStorage.removeItem("psn_checkout_email");
      sessionStorage.removeItem("psn_checkout_billing");

      // Go to download page with welcome flag
      navigate("/download?welcome=1");
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Something went wrong." });
      setLoading(false);
    }
  };

  const field = (label: string, key: string, child: React.ReactNode) => (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>
      {child}
      {errors[key] && (
        <p className="mt-1.5 text-xs text-red-400">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-yellow-400 text-slate-950 p-2 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight">
            PickSmart <span className="text-yellow-400">NOVA</span>
          </span>
        </div>

        {/* Progress banner */}
        <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-3">
          <p className="text-green-400 text-xs font-bold uppercase tracking-wide mb-1">Step 1 of 2 — Create your account</p>
          <div className="flex gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-green-500" />
            <div className="h-1.5 flex-1 rounded-full bg-slate-700" />
          </div>
          <p className="text-slate-400 text-xs mt-1.5">Payment confirmed ✓ &nbsp;·&nbsp; Register &nbsp;·&nbsp; Download app</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-7">
            Set up your login to access PickSmart NOVA on any device.
          </p>

          {errors.general && (
            <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-300 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {field("Full name", "fullName",
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                autoFocus
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
              />
            )}

            {field("Email address", "email",
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
              />
            )}

            {field("Username", "username",
              <div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="johnsmith92"
                  autoComplete="username"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                />
                <p className="text-xs text-slate-600 mt-1">Letters, numbers, and underscores only. This is what you'll use to sign in.</p>
              </div>
            )}

            {field("Password", "password",
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {field("Confirm password", "confirm",
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-4 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                "Create Account & Continue →"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-yellow-400 hover:text-yellow-300 transition underline">
              Sign in here
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
