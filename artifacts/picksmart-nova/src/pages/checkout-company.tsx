import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

const PLAN = {
  name: "Pro Annual",
  price: "$199.99",
  period: "year",
  features: [
    "Everything in Pro Monthly",
    "Save $81 per year",
    "Priority support",
    "Early access to new modules",
    "Certification badge",
  ],
};

export default function CompanyCheckoutPage() {
  const [, navigate] = useLocation();
  const { currentUser, updateSubscription } = useAuthStore();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login?redirect=/checkout/company");
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  function handleActivate() {
    setLoading(true);
    setTimeout(() => {
      updateSubscription("company");
      setDone(true);
      setTimeout(() => navigate("/training"), 2000);
    }, 900);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center space-y-5 max-w-md">
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-black">{PLAN.name} Active!</h2>
          <p className="text-slate-400 text-lg">Your investment is locked in. Taking you to your training hub…</p>
          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 px-6 py-4 text-yellow-300 text-sm font-semibold">
            Welcome to PickSmart NOVA. Let's build something great.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-14">
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.25em]">Checkout</p>
          <h1 className="text-4xl font-black">Activate Your Plan</h1>
        </div>

        <div className="rounded-3xl border border-green-500/30 bg-slate-900 p-8 space-y-6">
          <div>
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Best value</p>
            <h2 className="mt-2 text-2xl font-black">{PLAN.name}</h2>
            <div className="mt-4 flex items-end gap-1.5">
              <span className="text-4xl font-black">{PLAN.price}</span>
              <span className="text-slate-400 text-sm pb-1.5">/{PLAN.period}</span>
            </div>
          </div>

          <ul className="space-y-2.5">
            {PLAN.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleActivate}
            disabled={loading}
            className="w-full rounded-2xl bg-yellow-400 py-4 text-base font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Activating…
              </span>
            ) : `Activate — ${PLAN.price}/${PLAN.period}`}
          </button>

          <p className="text-xs text-slate-600 text-center">Secure activation · Cancel anytime · No hidden fees</p>
        </div>

        <p className="text-center text-sm text-slate-600">
          Want a different plan?{" "}
          <button onClick={() => navigate("/pricing")} className="text-yellow-400 hover:underline font-semibold">
            View all plans
          </button>
        </p>
      </div>
    </div>
  );
}
