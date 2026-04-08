import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

export default function PersonalCheckoutPage() {
  const [, navigate] = useLocation();
  const { currentUser, updateSubscription } = useAuthStore();
  const [done, setDone] = useState(false);

  function complete() {
    if (!currentUser) { navigate("/login"); return; }
    updateSubscription("personal");
    setDone(true);
    setTimeout(() => navigate("/training"), 1800);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-black">Personal Plan Active!</h2>
          <p className="text-slate-400">Taking you to your training hub…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-xl mx-auto">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.22em]">Checkout</p>
          <h1 className="mt-3 text-3xl font-black">Personal Plan Checkout</h1>
          <p className="mt-2 text-slate-400">Individual selector access for training and NOVA tools.</p>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">What's included</p>
            {["Training modules", "NOVA Help — AI voice coach", "NOVA Trainer — ES3 simulation", "Common Mistakes", "Leaderboard", "Selector Nation"].map((f) => (
              <p key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                <span className="text-yellow-400">✓</span> {f}
              </p>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 flex justify-between items-center">
            <span className="text-slate-400 text-sm">Plan</span>
            <span className="font-black text-white">Personal</span>
          </div>

          {!currentUser && (
            <p className="mt-4 text-sm text-amber-400">
              You need to be signed in to subscribe.{" "}
              <button onClick={() => navigate("/login?redirect=/checkout/personal")} className="underline">Sign in</button>
            </p>
          )}

          <button
            onClick={complete}
            disabled={!currentUser}
            className="mt-6 w-full rounded-2xl bg-yellow-400 py-4 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Complete Personal Subscription
          </button>

          <button
            onClick={() => navigate("/choose-plan")}
            className="mt-3 w-full text-xs text-slate-600 hover:text-slate-400 transition"
          >
            ← Back to plans
          </button>

        </div>
      </div>
    </div>
  );
}
