import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const { currentUser, updateSubscription } = useAuthStore();

  useEffect(() => {
    // Mark user as subscribed locally
    if (currentUser) {
      updateSubscription("personal");
    }
  }, [currentUser, updateSubscription]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-6">

        <div className="mx-auto w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
          <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <p className="text-yellow-400 text-sm font-bold uppercase tracking-[0.22em]">Payment confirmed</p>
          <h1 className="mt-2 text-4xl font-black">Welcome to PickSmart NOVA!</h1>
          <p className="mt-4 text-slate-300 text-lg">
            Your subscription is active. You now have full access to training, NOVA tools, the leaderboard, and everything else on the platform.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left space-y-3">
          <p className="font-bold text-white">What's unlocked for you:</p>
          {[
            "All training modules",
            "NOVA Help — AI voice warehouse coach",
            "NOVA Trainer — real-time pick direction",
            "Common Mistakes library",
            "Leaderboard",
            "Selector Breaking News",
          ].map((f) => (
            <p key={f} className="flex items-center gap-2 text-slate-300 text-sm">
              <span className="text-yellow-400 font-bold">✓</span> {f}
            </p>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/training")}
            className="flex-1 rounded-2xl bg-yellow-400 px-6 py-4 font-bold text-slate-950 hover:bg-yellow-300 transition"
          >
            Start Training →
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 rounded-2xl border border-slate-700 px-6 py-4 font-bold text-slate-300 hover:text-white hover:border-slate-500 transition"
          >
            Go Home
          </button>
        </div>

        <p className="text-slate-600 text-xs">
          A receipt was sent to your email. Manage your subscription any time at{" "}
          <a href="https://billing.stripe.com" target="_blank" rel="noreferrer" className="underline hover:text-slate-400">
            billing.stripe.com
          </a>
        </p>

      </div>
    </div>
  );
}
