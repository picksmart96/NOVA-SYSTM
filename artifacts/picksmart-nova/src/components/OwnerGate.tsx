import { useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";

const MASTER_USERNAME = "draogo96";
const MASTER_PASSWORD = "Draogo1996#";

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps the Owner Control Center.
 * - If the user is already logged in as the master owner, renders children immediately.
 * - Otherwise shows a dedicated credential gate right on the /owner page —
 *   no redirect, no generic login. Only draogo96 / Draogo1996# unlocks it.
 */
export default function OwnerGate({ children }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const isMaster =
    currentUser?.username === MASTER_USERNAME && currentUser?.role === "owner";

  if (isMaster) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));

    if (username.trim() !== MASTER_USERNAME || password !== MASTER_PASSWORD) {
      setLoading(false);
      setError("Incorrect credentials. Only the owner account can access this panel.");
      setPassword("");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    const ok = login(username.trim(), password);
    setLoading(false);
    if (!ok) {
      setError("Login failed. Please try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">

      {/* Grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#facc15 1px,transparent 1px),linear-gradient(90deg,#facc15 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400">
            <Shield className="h-7 w-7 text-slate-950" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-1">PickSmart NOVA</p>
            <h1 className="text-3xl font-black text-white">Owner Control Center</h1>
            <p className="text-slate-500 text-sm mt-1">Restricted access — owner credentials required</p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
              <Lock className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-bold text-base">Sign in to continue</p>
              <p className="text-slate-500 text-xs">This panel is locked to the owner account only</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`space-y-4 ${shaking ? "animate-shake" : ""}`}
          >
            <div>
              <label className="block text-sm text-slate-400 mb-2">Username</label>
              <input
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                autoComplete="username"
                autoFocus
                placeholder="Enter owner username"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  autoComplete="current-password"
                  placeholder="Enter owner password"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-3.5 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying…" : "Access Owner Panel"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-slate-600 text-xs">
          PickSmart Academy — Owner access only. All sessions are cleared on close.
        </p>
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
