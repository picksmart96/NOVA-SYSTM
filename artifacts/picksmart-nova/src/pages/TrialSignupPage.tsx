import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { Activity, Eye, EyeOff, Building2, CheckCircle2, Star } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export default function TrialSignupPage() {
  const [, navigate] = useLocation();
  const { loginWithToken } = useAuthStore();

  const [form, setForm] = useState({
    companyName: "",
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  function set(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.companyName.trim())               e.companyName = "Company name is required.";
    if (!form.fullName.trim())                  e.fullName    = "Full name is required.";
    if (!form.email.includes("@"))              e.email       = "Enter a valid email address.";
    if (form.username.trim().length < 3)        e.username    = "Username must be at least 3 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) e.username = "Letters, numbers, underscores only.";
    if (form.password.length < 8)              e.password    = "Password must be at least 8 characters.";
    if (form.password !== form.confirm)         e.confirm     = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/auth/trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          fullName:    form.fullName.trim(),
          email:       form.email.trim(),
          username:    form.username.trim(),
          password:    form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("username")) setErrors({ username: data.error });
        else if (data.error?.toLowerCase().includes("email")) setErrors({ email: data.error });
        else setErrors({ general: data.error ?? "Something went wrong." });
        setLoading(false);
        return;
      }

      loginWithToken(data.token, data.user);
      navigate("/company-dashboard");
    } catch {
      setErrors({ general: "Network error. Please try again." });
      setLoading(false);
    }
  }

  const field = (
    label: string,
    key: string,
    child: React.ReactNode,
    hint?: string
  ) => (
    <div>
      <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
      {child}
      {hint && !errors[key] && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
      {errors[key] && <p className="mt-1 text-xs text-red-400">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row">

      {/* ── Left panel — value prop ── */}
      <div className="hidden lg:flex flex-col justify-center px-16 py-20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-r border-slate-800 w-[420px] shrink-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-yellow-400 text-slate-950 p-2 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight">
            PickSmart <span className="text-yellow-400">NOVA</span>
          </span>
        </div>

        <h1 className="text-4xl font-black leading-tight mb-4">
          Train smarter.<br />
          <span className="text-yellow-400">Pick faster.</span>
        </h1>
        <p className="text-slate-400 text-base mb-10 leading-relaxed">
          Give your warehouse team a voice-directed training platform trusted by professional pickers. No commitment — free for 30 days.
        </p>

        <ul className="space-y-4 text-sm">
          {[
            "Full company dashboard — trainers, supervisors, selectors",
            "NOVA voice-directed picking sessions (NOVA / Jennifer)",
            "Real-time mistake tracking & coaching alerts",
            "CSV assignment upload or random generator",
            "Warehouse profile & zone configuration",
            "Cancel anytime — no card required during trial",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-black uppercase tracking-wider">30-Day Free Trial</span>
          </div>
          <p className="text-slate-400 text-xs">
            Full company access. No credit card. Upgrade to a paid plan anytime from your dashboard.
          </p>
        </div>
      </div>

      {/* ── Right panel — signup form ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="bg-yellow-400 text-slate-950 p-2 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">
              PickSmart <span className="text-yellow-400">NOVA</span>
            </span>
          </div>

          {/* Trial badge */}
          <div className="mb-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 flex items-center gap-3">
            <Star className="h-5 w-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-yellow-400 text-xs font-black uppercase tracking-wide">30-Day Free Trial</p>
              <p className="text-slate-400 text-xs mt-0.5">Full company access · No credit card needed</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-1">Start your free trial</h2>
            <p className="text-slate-400 text-sm mb-7">Set up your company account in under a minute.</p>

            {errors.general && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {field(
                "Company Name",
                "companyName",
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    placeholder="Acme Logistics Inc."
                    className={`w-full rounded-xl border bg-slate-950 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40 transition ${errors.companyName ? "border-red-500/50" : "border-slate-700"}`}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {field(
                  "Full Name",
                  "fullName",
                  <input
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="John Martinez"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40 transition ${errors.fullName ? "border-red-500/50" : "border-slate-700"}`}
                  />
                )}
                {field(
                  "Username",
                  "username",
                  <input
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                    placeholder="jmartinez"
                    autoCapitalize="none"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40 transition ${errors.username ? "border-red-500/50" : "border-slate-700"}`}
                  />,
                  "Used to log in"
                )}
              </div>

              {field(
                "Work Email",
                "email",
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="john@acmelogistics.com"
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40 transition ${errors.email ? "border-red-500/50" : "border-slate-700"}`}
                />
              )}

              {field(
                "Password",
                "password",
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="At least 8 characters"
                    className={`w-full rounded-xl border bg-slate-950 px-4 pr-11 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40 transition ${errors.password ? "border-red-500/50" : "border-slate-700"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {field(
                "Confirm Password",
                "confirm",
                <input
                  type={showPass ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40 transition ${errors.confirm ? "border-red-500/50" : "border-slate-700"}`}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-yellow-400 text-slate-950 font-black py-3.5 text-sm mt-2 hover:bg-yellow-300 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account…" : "Start Free Trial →"}
              </button>
            </form>

            <p className="text-center text-xs text-slate-600 mt-5">
              Already have an account?{" "}
              <a href="/login" className="text-yellow-400 hover:underline">Sign in</a>
            </p>
          </div>

          <p className="text-center text-xs text-slate-700 mt-4">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
