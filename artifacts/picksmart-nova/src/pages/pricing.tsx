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
    badge: null,
    highlight: false,
    features: [
      "Access for 1 selector",
      "All 6 modules",
      "Progress tracking",
      "Performance reports",
      "Trainer support",
    ],
    cta: "Start Training",
    checkoutPath: "/checkout/personal?plan=selector",
  },
  {
    key: "pro_monthly" as PlanKey,
    name: "Pro Monthly",
    tagline: "Full access to all training",
    price: "$29.99",
    period: "month",
    badge: "Most Popular",
    highlight: true,
    features: [
      "All 6 modules",
      "Video lessons & demonstrations",
      "Advanced speed techniques",
      "Pallet building masterclass",
      "Rate improvement strategies",
      "New content added monthly",
    ],
    cta: "Go Pro",
    checkoutPath: "/checkout/personal",
  },
  {
    key: "pro_annual" as PlanKey,
    name: "Pro Annual",
    tagline: "Best value — save over 40%",
    price: "$199.99",
    period: "year",
    badge: "Best Value",
    highlight: false,
    features: [
      "Everything in Pro Monthly",
      "Save $81 per year",
      "Priority support",
      "Early access to new modules",
      "Certification badge",
    ],
    cta: "Go Pro",
    checkoutPath: "/checkout/company",
  },
];

const FAQS = [
  { q: "Can I start with Selector and upgrade later?", a: "Yes. You can upgrade to Pro Monthly or Pro Annual at any time from your account." },
  { q: "Is the Pro Annual plan a commitment?", a: "Pro Annual is billed once per year and gives the best value — over 40% off compared to monthly." },
  { q: "What's included in all 6 training modules?", a: "Modules cover voice picking fundamentals, speed techniques, pallet building, safety, rate improvement, and advanced warehouse operations." },
  { q: "Can Company users access Owner tools?", a: "No. Owner tools and Users & Access remain private to the owner account only." },
  { q: "Is there a free trial?", a: "The Home page and course previews are always public. A full subscription unlocks all modules and NOVA tools." },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { currentUser } = useAuthStore();

  const [selected, setSelected] = useState<PlanKey>("pro_monthly");

  const selectedPlan = PLANS.find((p) => p.key === selected)!;

  function handleCta(plan: typeof PLANS[0]) {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(plan.checkoutPath)}`);
      return;
    }
    navigate(plan.checkoutPath);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.22em]">Simple Pricing</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight">Invest in Your Career</h1>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            Start free or unlock everything with Pro. Most selectors make back the cost in their first week of better rates.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isSelected = selected === plan.key;
            return (
              <div
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                className={`relative flex flex-col rounded-3xl border p-8 shadow-xl cursor-pointer transition-all ${
                  isSelected
                    ? "border-yellow-400 bg-slate-900 ring-2 ring-yellow-400/20"
                    : plan.highlight
                    ? "border-slate-600 bg-slate-900 hover:border-slate-500"
                    : "border-slate-800 bg-slate-900 hover:border-slate-600"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`rounded-full px-4 py-1 text-xs font-black ${
                      plan.badge === "Most Popular" ? "bg-yellow-400 text-slate-950" : "bg-green-500 text-white"
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest">{plan.tagline}</p>
                <h2 className="mt-3 text-2xl font-black text-white">{plan.name}</h2>

                <div className={`mt-6 rounded-2xl border p-5 transition ${
                  isSelected ? "border-yellow-400/40 bg-yellow-400/5" : "border-slate-800 bg-slate-950"
                }`}>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm pb-1.5">/{plan.period}</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${isSelected ? "text-slate-200" : "text-slate-400"}`}>
                      <CheckIcon color={isSelected ? "text-yellow-400" : "text-slate-500"} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={(e) => { e.stopPropagation(); handleCta(plan); }}
                  className={`mt-8 w-full rounded-2xl px-6 py-4 text-base font-black transition ${
                    plan.highlight || isSelected
                      ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                      : "border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-950"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Savings callout */}
        <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-center">
          <p className="text-green-400 font-semibold text-sm">
            Go Pro Annual and save over 40% — that's $81 back in your pocket every year.
          </p>
        </div>

        {!currentUser && (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-center">
            <p className="text-amber-400 text-sm">
              You'll need to sign in before activating a plan.{" "}
              <button onClick={() => navigate("/login?redirect=/pricing")} className="underline font-bold">
                Sign in now
              </button>
            </p>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="border-b border-slate-800 pb-5 last:border-0 last:pb-0">
                <p className="font-semibold text-white">{q}</p>
                <p className="mt-1 text-slate-400 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-8 text-center">
          <h2 className="text-2xl font-black">Ready to start training smarter?</h2>
          <p className="mt-2 text-slate-400">Pick a plan and get access to NOVA today.</p>
          <button
            onClick={() => handleCta(selectedPlan)}
            className="mt-6 rounded-2xl bg-yellow-400 px-8 py-3 font-black text-slate-950 hover:bg-yellow-300 transition"
          >
            Get Started
          </button>
          <p className="mt-3 text-xs text-slate-600">Secure activation · Cancel anytime · No hidden fees</p>
        </div>

      </div>
    </div>
  );
}
