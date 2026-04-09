import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

const PLANS = [
  {
    key: "selector",
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
    key: "pro_monthly",
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
    key: "pro_annual",
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
    cta: "Go Pro Annual",
    checkoutPath: "/checkout/company",
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { currentUser } = useAuthStore();

  function handleCta(checkoutPath: string) {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(checkoutPath)}`);
      return;
    }
    navigate(checkoutPath);
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
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-3xl border p-8 shadow-xl ${
                plan.highlight ? "border-yellow-400 bg-slate-900" : "border-slate-800 bg-slate-900"
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

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm pb-1.5">/{plan.period}</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-slate-300 text-sm">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCta(plan.checkoutPath)}
                className={`mt-8 w-full rounded-2xl px-6 py-4 text-base font-black transition ${
                  plan.highlight
                    ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                    : "border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-950"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
