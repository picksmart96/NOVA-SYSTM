import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

function CheckIcon({ color = "text-yellow-400" }: { color?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 shrink-0 mt-0.5 ${color}`}>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

type PlanKey = "selector" | "pro_monthly" | "pro_annual";

const PLANS = [
  {
    key: "selector" as PlanKey,
    name: "Selector",
    tagline: "Train individual warehouse selectors",
    price: "$10",
    period: "per selector",
    note: "",
    badge: null,
    highlight: false,
    features: [
      "Access for 1 selector",
      "All 6 training modules",
      "Progress tracking",
      "Performance reports",
      "Trainer support",
    ],
    cta: "Start Training",
    sub: "personal" as "personal" | "company",
  },
  {
    key: "pro_monthly" as PlanKey,
    name: "Pro Monthly",
    tagline: "Full access to all training",
    price: "$29.99",
    period: "month",
    note: "",
    badge: "Most Popular",
    highlight: true,
    features: [
      "All 6 training modules",
      "Video lessons & demonstrations",
      "Advanced speed techniques",
      "Pallet building masterclass",
      "Rate improvement strategies",
      "New content added monthly",
    ],
    cta: "Go Pro",
    sub: "personal" as "personal" | "company",
  },
  {
    key: "pro_annual" as PlanKey,
    name: "Pro Annual",
    tagline: "Best value — save over 40%",
    price: "$199.99",
    period: "year",
    note: "",
    badge: "Best Value",
    highlight: false,
    features: [
      "Everything in Pro Monthly",
      "Save $81 per year",
      "Priority support",
      "Early access to new modules",
      "Certification badge",
    ],
    cta: "Get Best Value",
    sub: "company" as "personal" | "company",
  },
];

export default function InvestInCareerPage() {
  const [, navigate] = useLocation();
  const { currentUser, updateSubscription } = useAuthStore();

  const [selected, setSelected] = useState<PlanKey>("pro_monthly");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedPlan = PLANS.find((p) => p.key === selected)!;

  function handleInvest() {
    if (!currentUser) { navigate("/login?redirect=/choose-plan"); return; }
    setLoading(true);
    setTimeout(() => {
      updateSubscription(selectedPlan.sub);
      setDone(true);
      setTimeout(() => navigate("/training"), 2000);
    }, 900);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center space-y-5 max-w-md">
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-black">{selectedPlan.name} Active!</h2>
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
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Hero */}
        <div className="text-center space-y-4">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.25em]">Simple Pricing</p>
          <h1 className="text-5xl sm:text-6xl font-black leading-tight">Invest in Your Career</h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Start free or unlock everything with Pro. Most selectors make back the cost in their first week of better rates.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isSelected = selected === plan.key;
            return (
              <button
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                className={`relative text-left rounded-3xl border-2 p-8 shadow-2xl transition-all flex flex-col ${
                  isSelected
                    ? "border-yellow-400 bg-slate-900 ring-2 ring-yellow-400/30 scale-[1.02]"
                    : plan.highlight
                    ? "border-slate-600 bg-slate-900 hover:border-slate-500"
                    : "border-slate-800 bg-slate-900 hover:border-slate-600"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`rounded-full px-4 py-1 text-xs font-black ${
                      plan.badge === "Most Popular"
                        ? "bg-yellow-400 text-slate-950"
                        : "bg-green-500 text-white"
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Selection ring */}
                <div className="flex items-start justify-between mb-5">
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest leading-snug max-w-[80%]">
                    {plan.tagline}
                  </p>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ml-2 ${
                    isSelected ? "border-yellow-400 bg-yellow-400" : "border-slate-600"
                  }`}>
                    {isSelected && (
                      <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3 text-slate-950">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-black">{plan.name}</h2>

                {/* Price */}
                <div className={`mt-5 rounded-2xl border p-5 transition ${
                  isSelected ? "border-yellow-400/40 bg-yellow-400/5" : "border-slate-800 bg-slate-950"
                }`}>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm pb-1.5">/{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${isSelected ? "text-slate-200" : "text-slate-400"}`}>
                      <CheckIcon color={isSelected ? "text-yellow-400" : "text-slate-500"} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Card CTA */}
                <div className={`mt-7 rounded-2xl px-4 py-3 text-center text-sm font-black transition ${
                  isSelected
                    ? "bg-yellow-400 text-slate-950"
                    : "border border-slate-700 text-slate-400 group-hover:border-yellow-400"
                }`}>
                  {plan.cta}
                </div>
              </button>
            );
          })}
        </div>

        {/* Invest CTA */}
        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-8 text-center space-y-5">
          <div>
            <h2 className="text-2xl font-black">Ready to invest in yourself?</h2>
            <p className="mt-2 text-slate-400 text-base">
              You selected{" "}
              <span className="text-yellow-400 font-bold">{selectedPlan.name}</span>
              {" — "}
              <span className="text-white font-bold">
                {selectedPlan.price}/{selectedPlan.period}
              </span>
            </p>
          </div>

          {!currentUser && (
            <p className="text-sm text-amber-400 bg-amber-400/10 rounded-2xl px-4 py-3">
              You need to be signed in to get started.{" "}
              <button onClick={() => navigate("/login?redirect=/choose-plan")} className="underline font-bold">
                Sign in first
              </button>
            </p>
          )}

          <button
            onClick={handleInvest}
            disabled={!currentUser || loading}
            className="w-full max-w-sm mx-auto flex items-center justify-center rounded-2xl bg-yellow-400 py-5 text-lg font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Activating your plan…
              </span>
            ) : (
              `${selectedPlan.cta} — ${selectedPlan.price}/${selectedPlan.period}`
            )}
          </button>

          <p className="text-xs text-slate-600">Secure activation · Cancel anytime · No hidden fees</p>
        </div>

        <p className="text-center text-sm text-slate-600">
          Want to compare?{" "}
          <button onClick={() => navigate("/pricing")} className="text-yellow-400 hover:underline font-semibold">
            View pricing details
          </button>
        </p>

      </div>
    </div>
  );
}
