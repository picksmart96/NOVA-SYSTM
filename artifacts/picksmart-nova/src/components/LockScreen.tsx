import { useState } from "react";
import { useAuthStore } from "@/lib/authStore";

export default function LockScreen() {
  const { currentUser, unlock, logout } = useAuthStore();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [shaking, setShaking] = useState(false);

  if (!currentUser) return null;

  const initials = currentUser.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    const ok = unlock(password);
    if (ok) {
      setPassword("");
      setError("");
    } else {
      setError("Incorrect password");
      setPassword("");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950">

      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#facc15 1px,transparent 1px),linear-gradient(90deg,#facc15 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm px-6">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-950" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight">
            PickSmart <span className="text-yellow-400">NOVA</span>
          </span>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 text-2xl font-black text-yellow-400">
            {initials}
          </div>
          <div className="text-center">
            <p className="font-semibold text-white text-base">{currentUser.fullName}</p>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{currentUser.role} · {currentUser.username}</p>
          </div>
        </div>

        {/* Lock icon */}
        <div className="flex flex-col items-center gap-1 text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
          </svg>
          <p className="text-xs">Session locked</p>
        </div>

        {/* Password form */}
        <form
          onSubmit={handleUnlock}
          className={`w-full space-y-3 ${shaking ? "animate-shake" : ""}`}
        >
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter your password"
              autoFocus
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 pr-11 text-sm text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              tabIndex={-1}
            >
              {showPw ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" />
                  <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full rounded-2xl bg-yellow-400 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Unlock
          </button>
        </form>

        {/* Sign out fallback */}
        <button
          onClick={() => { logout(); }}
          className="text-xs text-slate-600 hover:text-slate-400 transition mt-1"
        >
          Sign out instead
        </button>

      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
        .animate-shake { animation: shake 0.45s ease; }
      `}</style>
    </div>
  );
}
