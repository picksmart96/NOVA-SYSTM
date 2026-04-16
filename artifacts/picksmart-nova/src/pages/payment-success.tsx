import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { CheckCircle2, Activity } from "lucide-react";

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [count, setCount] = useState(5);
  const currentUser = useAuthStore((s) => s.currentUser);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const destination = currentUser ? "/command" : "/register?plan=company";

  useEffect(() => {
    if (count <= 0) {
      navigate(destination);
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate, destination]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-6">

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-yellow-400 text-slate-950 p-1.5 rounded-lg">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-black text-sm">PickSmart <span className="text-yellow-400">NOVA</span></span>
        </div>

        <div className="mx-auto w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>

        <div>
          <p className="text-green-400 text-sm font-bold uppercase tracking-[0.22em]">Payment confirmed</p>
          <h1 className="mt-2 text-4xl font-black">You're subscribed!</h1>
          <p className="mt-4 text-slate-300 text-lg leading-relaxed">
            {currentUser
              ? "Your account has been upgraded. Welcome to PickSmart NOVA."
              : "Your payment was successful. Create your account to get started."}
          </p>
        </div>

        {currentUser ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left space-y-4">
            <p className="font-bold text-yellow-400 text-sm uppercase tracking-wide">You now have access to</p>
            {[
              { label: "NOVA Voice Sessions",      sub: "Full voice-directed picking simulator" },
              { label: "Trainer Portal",            sub: "Build assignments, track mistakes" },
              { label: "Unlimited Selectors",       sub: "Invite your full warehouse team" },
              { label: "Warehouse Configuration",   sub: "Zones, slots, door codes" },
            ].map(({ label, sub }) => (
              <div key={label} className="flex items-center gap-4">
                <CheckCircle2 className="h-5 w-5 text-yellow-400 shrink-0" />
                <div>
                  <p className="font-bold text-white text-sm">{label}</p>
                  <p className="text-slate-500 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left space-y-4">
            <p className="font-bold text-yellow-400 text-sm uppercase tracking-wide">Your next steps</p>
            {[
              { n: "1", label: "Create your account",      sub: "Pick a username and password" },
              { n: "2", label: "Set up your warehouse",    sub: "Configure zones, slots, and doors" },
              { n: "3", label: "Invite your team",         sub: "Add selectors, trainers, supervisors" },
            ].map(({ n, label, sub }) => (
              <div key={n} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 font-black text-sm flex items-center justify-center shrink-0">
                  {n}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{label}</p>
                  <p className="text-slate-500 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate(destination)}
          className="w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 hover:bg-yellow-300 transition"
        >
          {currentUser ? "Go to Command Center →" : "Create My Account →"}
        </button>

        <p className="text-slate-600 text-xs">
          Redirecting automatically in {count}s · A receipt was emailed to you
        </p>

      </div>
    </div>
  );
}
