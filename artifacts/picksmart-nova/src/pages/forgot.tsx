import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { Activity, Mail, KeyRound, User, ArrowLeft, Check, Eye, EyeOff, RefreshCw } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type Step = "choose" | "email" | "code" | "reset" | "done";
type Mode = "password" | "username";

export default function ForgotPage() {
  const [, navigate] = useLocation();
  const { getUserByEmail, resetPassword } = useAuthStore();

  const [mode, setMode] = useState<Mode>("password");
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [foundUsername, setFoundUsername] = useState("");

  async function handleSendCode() {
    setError("");
    const account = getUserByEmail(email.trim());
    if (!account) {
      setError("No account found with that email address.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "username") {
        const r = await fetch(`${BASE}/api/auth/send-username`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), name: account.fullName, username: account.username }),
        });
        if (r.ok) {
          setFoundUsername(account.username);
          setStep("done");
        } else {
          const d = await r.json().catch(() => ({}));
          setError(d.error ?? "Failed to send email. Try again.");
        }
      } else {
        const r = await fetch(`${BASE}/api/auth/send-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), name: account.fullName, type: "reset" }),
        });
        if (r.ok) {
          setStep("code");
        } else {
          const d = await r.json().catch(() => ({}));
          setError(d.error ?? "Failed to send email. Try again.");
        }
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setStep("reset");
      } else {
        setError(d.error ?? "Invalid code. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleResetPassword() {
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    const ok = resetPassword(email.trim(), newPassword);
    if (ok) {
      setStep("done");
    } else {
      setError("Could not reset password. Please try again.");
    }
  }

  const inputCls = "w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600";
  const btnYellow = "w-full rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="bg-yellow-400 text-slate-950 p-2 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            PickSmart <span className="text-yellow-400">NOVA</span>
          </span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

          {/* ── Step: choose mode ── */}
          {step === "choose" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                  <KeyRound className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">Account recovery</h1>
                  <p className="text-slate-400 text-sm">What do you need help with?</p>
                </div>
              </div>
              <button
                onClick={() => { setMode("password"); setStep("email"); }}
                className="w-full flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-950 hover:border-yellow-400 p-4 transition text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center shrink-0">
                  <KeyRound className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Forgot my password</p>
                  <p className="text-sm text-slate-400">Reset it using your email address</p>
                </div>
              </button>
              <button
                onClick={() => { setMode("username"); setStep("email"); }}
                className="w-full flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-950 hover:border-blue-400 p-4 transition text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Forgot my username</p>
                  <p className="text-sm text-slate-400">We'll send it to your email address</p>
                </div>
              </button>
            </div>
          )}

          {/* ── Step: enter email ── */}
          {step === "email" && (
            <div className="space-y-5">
              <button onClick={() => setStep("choose")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition mb-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div>
                <h1 className="text-2xl font-black text-white">
                  {mode === "password" ? "Reset your password" : "Find your username"}
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  {mode === "password"
                    ? "Enter your email and we'll send a reset code."
                    : "Enter your email and we'll send your username right away."}
                </p>
              </div>
              {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                    onKeyDown={e => e.key === "Enter" && email && handleSendCode()}
                  />
                </div>
              </div>
              <button onClick={handleSendCode} disabled={loading || !email} className={btnYellow}>
                {loading ? "Sending…" : mode === "password" ? "Send reset code" : "Send my username"}
              </button>
            </div>
          )}

          {/* ── Step: enter code ── */}
          {step === "code" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-yellow-400" />
                </div>
                <h1 className="text-2xl font-black text-white">Check your email</h1>
                <p className="text-slate-400 text-sm mt-2">
                  We sent a 6-digit code to <span className="text-white font-semibold">{email}</span>
                </p>
              </div>
              {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Verification code</label>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white text-center text-2xl font-black tracking-[12px] outline-none focus:border-yellow-400 transition placeholder:text-slate-700 placeholder:tracking-normal"
                  onKeyDown={e => e.key === "Enter" && code.length === 6 && handleVerifyCode()}
                />
                <p className="text-xs text-slate-500 mt-2 text-center">Code expires in 10 minutes</p>
              </div>
              <button onClick={handleVerifyCode} disabled={loading || code.length !== 6} className={btnYellow}>
                {loading ? "Verifying…" : "Verify code"}
              </button>
              <button
                onClick={() => { setCode(""); handleSendCode(); }}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Resend code
              </button>
            </div>
          )}

          {/* ── Step: new password ── */}
          {step === "reset" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-black text-white">Create new password</h1>
                <p className="text-slate-400 text-sm mt-1">Choose a strong password for your account.</p>
              </div>
              {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>}
              <div>
                <label className="block text-sm text-slate-400 mb-2">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={inputCls}
                />
              </div>
              <button onClick={handleResetPassword} disabled={!newPassword || !confirmPassword} className={btnYellow}>
                Reset password
              </button>
            </div>
          )}

          {/* ── Step: done ── */}
          {step === "done" && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              {mode === "password" ? (
                <>
                  <h1 className="text-2xl font-black text-white">Password reset!</h1>
                  <p className="text-slate-400">Your password has been updated. You can now sign in with your new password.</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-black text-white">Username sent!</h1>
                  <p className="text-slate-400">
                    We sent your username to <span className="text-white font-semibold">{email}</span>. Check your inbox.
                  </p>
                </>
              )}
              <button
                onClick={() => navigate("/login")}
                className={btnYellow}
              >
                Go to Sign in
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-slate-600 text-sm">
          <Link href="/login">
            <span className="text-yellow-400 hover:text-yellow-300 cursor-pointer transition">← Back to Sign in</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
