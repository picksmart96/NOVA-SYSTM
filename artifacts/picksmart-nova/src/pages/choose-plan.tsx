import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 mt-0.5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

type Cycle = "monthly" | "yearly";
type PlanKey = "personal" | "company";

const PLANS = {
  personal: {
    key: "personal" as PlanKey,
    name: "Single Professional",
    tagline: "For individual selectors",
    description: "Everything you need to train, improve your rate, and build a warehouse career you're proud of.",
    features: [
      "Full training module library",
      "NOVA Help — AI voice coach",
      "NOVA Trainer — ES3 voice picking simulation",
      "Common Mistakes coaching",
      "Leaderboard",
      "Selector Breaking News community",
    ],
    monthly: { amount: "$25", period: "month", note: "Billed monthly. Cancel anytime." },
    yearly: { amount: "$240", period: "year", note: "Just $20/month. 2 months free.", badge: "Save $60" },
  },
  company: {
    key: "company" as PlanKey,
    name: "Company",
    tagline: "For teams and warehouse operations",
    description: "Give your entire team the tools to train consistently, track progress, and operate with precision.",
    features: [
      "Everything in Single Professional",
      "Unlimited team members",
      "Trainer Dashboard",
      "Supervisor Dashboard",
      "Assignment management",
      "Live team tracking",
    ],
    monthly: { amount: "$1,660", period: "week", note: "Billed weekly. Cancel anytime." },
    yearly: { amount: "$75,000", period: "year", note: "~$1,442/week. Best value.", badge: "Save ~$11,320" },
  },
};

const CAREER_STATS = [
  { value: "3×", label: "faster onboarding with voice training" },
  { value: "40%", label: "fewer picking errors reported" },
  { value: "100%", label: "bilingual — English & Spanish" },
  { value: "24/7", label: "NOVA AI coach always available" },
];

export default function InvestInCareerPage() {
  const [, navigate] = useLocation();
  const { currentUser, updateSubscription } = useAuthStore();

  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [selected, setSelected] = useState<PlanKey>("personal");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleInvest() {
    if (!currentUser) { navigate("/login?redirect=/choose-plan"); return; }
    setLoading(true);
    setTimeout(() => {
      updateSubscription(selected);
      setDone(true);
      setTimeout(() => navigate("/training"), 2000);
    }, 900);
  }

  if (done) {
    const plan = PLANS[selected];
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center space-y-5 max-w-md">
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-black">{plan.name} Plan Active!</h2>
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
      <div className="max-w-5xl mx-auto space-y-14">

        {/* Hero */}
        <div className="text-center space-y-5">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.25em]">Your future starts here</p>
          <h1 className="text-5xl sm:text-6xl font-black leading-tight">
            Invest in Your Career
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            PickSmart NOVA is the training platform built by warehouse people, for warehouse people. Pick your plan and level up.
          </p>
        </div>

        {/* Career stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CAREER_STATS.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-4xl font-black text-yellow-400">{stat.value}</p>
              <p className="mt-2 text-xs text-slate-400 leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="flex rounded-2xl border border-slate-700 bg-slate-900 p-1">
            <button
              onClick={() => setCycle("monthly")}
              className={`rounded-xl px-8 py-3 text-sm font-bold transition ${
                cycle === "monthly" ? "bg-yellow-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly / Weekly
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition ${
                cycle === "yearly" ? "bg-yellow-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              {cycle !== "yearly" && (
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-400">
                  Best value
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {(Object.values(PLANS) as typeof PLANS[PlanKey][]).map((plan) => {
            const price = plan[cycle];
            const isSelected = selected === plan.key;
            return (
              <button
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                className={`text-left rounded-3xl border-2 p-8 shadow-2xl transition-all ${
                  isSelected
                    ? "border-yellow-400 bg-slate-900 ring-2 ring-yellow-400/30 scale-[1.01]"
                    : "border-slate-800 bg-slate-900 hover:border-slate-600"
                }`}
              >
                {/* Selection indicator */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest">{plan.tagline}</p>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition ${
                    isSelected ? "border-yellow-400 bg-yellow-400" : "border-slate-600"
                  }`}>
                    {isSelected && (
                      <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3 text-slate-950">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </div>
                </div>

                <h2 className="text-3xl font-black">{plan.name}</h2>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">{plan.description}</p>

                {/* Price */}
                <div className={`mt-6 rounded-2xl border p-5 transition ${
                  isSelected ? "border-yellow-400/40 bg-yellow-400/5" : "border-slate-800 bg-slate-950"
                }`}>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-white">{price.amount}</span>
                    <span className="text-slate-400 text-base pb-1.5">/{price.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{price.note}</p>
                  {"badge" in price && price.badge && (
                    <span className="mt-3 inline-flex rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
                      {price.badge}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${isSelected ? "text-slate-200" : "text-slate-400"}`}>
                      <span className="text-yellow-400"><CheckIcon /></span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Invest CTA */}
        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-8 text-center space-y-5">
          <div>
            <h2 className="text-2xl font-black">Ready to invest in yourself?</h2>
            <p className="mt-2 text-slate-400 text-base">
              You're selecting the <span className="text-yellow-400 font-bold">{PLANS[selected].name}</span> plan —{" "}
              <span className="text-white font-bold">
                {PLANS[selected][cycle].amount}/{PLANS[selected][cycle].period}
              </span>
            </p>
          </div>

          {!currentUser && (
            <p className="text-sm text-amber-400 bg-amber-400/10 rounded-2xl px-4 py-3">
              You need to be signed in to invest.{" "}
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
              `Invest Now — ${PLANS[selected][cycle].amount}/${PLANS[selected][cycle].period}`
            )}
          </button>

          <p className="text-xs text-slate-600">
            Secure activation · Cancel anytime · No hidden fees
          </p>
        </div>

        {/* Back link */}
        <p className="text-center text-sm text-slate-600">
          Want to compare plans?{" "}
          <button onClick={() => navigate("/pricing")} className="text-yellow-400 hover:underline font-semibold">
            View pricing details
          </button>
        </p>

      </div>
    </div>
  );
}
