import { useState } from "react";
import { useLocation } from "wouter";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

interface PriceInfo {
  amount: string;
  period: string;
  note: string;
  badge?: string;
}

interface PlanCardProps {
  title: string;
  subtitle: string;
  price: PriceInfo;
  features: string[];
  buttonText: string;
  href: string;
  highlight?: boolean;
}

function PlanCard({ title, subtitle, price, features, buttonText, href, highlight }: PlanCardProps) {
  const [, navigate] = useLocation();
  return (
    <div className={`relative flex flex-col rounded-3xl border p-8 shadow-xl transition ${
      highlight ? "border-yellow-400 bg-slate-900" : "border-slate-800 bg-slate-900"
    }`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-yellow-400 px-4 py-1 text-xs font-black text-slate-950">
            MOST POPULAR
          </span>
        </div>
      )}

      <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">{subtitle}</p>
      <h2 className="mt-3 text-3xl font-black text-white">{title}</h2>

      {/* Price block */}
      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-5">
        <div className="flex items-end gap-2">
          <span className="text-5xl font-black text-white">{price.amount}</span>
          <span className="text-slate-400 text-base pb-1.5">/{price.period}</span>
        </div>
        <p className="mt-2 text-sm text-slate-400">{price.note}</p>
        {price.badge && (
          <span className="mt-3 inline-flex rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
            {price.badge}
          </span>
        )}
      </div>

      <ul className="mt-6 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-slate-300 text-sm">
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => navigate(href)}
        className={`mt-8 w-full rounded-2xl px-6 py-4 text-base font-black transition ${
          highlight
            ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
            : "border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-950"
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
}

const FAQS = [
  { q: "Can I start with Personal and upgrade later?", a: "Yes. You can upgrade to Company at any time from your account." },
  { q: "Is the yearly plan a commitment?", a: "Yearly plans are billed once annually and offer the best value. Monthly and weekly plans are billed each cycle." },
  { q: "Can Company users access Owner tools?", a: "No. Owner tools and Users & Access remain private to the owner account only." },
  { q: "Is the Home page public?", a: "Yes. Home and Pricing are always public. Training tools require a subscription." },
  { q: "What is NOVA Trainer?", a: "NOVA Trainer is an ES3-style voice-directed picking simulation that trains selectors to respond correctly in a warehouse environment." },
];

export default function PricingPage() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  const professionalPrice: PriceInfo =
    cycle === "monthly"
      ? { amount: "$25", period: "month", note: "Billed monthly. Cancel anytime." }
      : { amount: "$240", period: "year", note: "That's just $20/month.", badge: "Save $60 — 2 months free" };

  const companyPrice: PriceInfo =
    cycle === "monthly"
      ? { amount: "$1,660", period: "week", note: "Billed weekly. Cancel anytime." }
      : { amount: "$75,000", period: "year", note: "Roughly $1,442/week.", badge: "Save ~$11,320 vs weekly" };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-10">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.22em]">Pricing</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight">
            Choose the Access That Fits You
          </h1>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            PickSmart NOVA gives selectors and warehouse teams the tools to train, improve, and operate with confidence.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex rounded-2xl border border-slate-700 bg-slate-900 p-1">
            <button
              onClick={() => setCycle("monthly")}
              className={`rounded-xl px-8 py-3 text-sm font-bold transition ${
                cycle === "monthly"
                  ? "bg-yellow-400 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly / Weekly
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition ${
                cycle === "yearly"
                  ? "bg-yellow-400 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              {cycle !== "yearly" && (
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-400">
                  Save more
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Savings callout (yearly only) */}
        {cycle === "yearly" && (
          <div className="mb-8 rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-center">
            <p className="text-green-400 font-semibold text-sm">
              🎉 You're viewing yearly pricing — the best value available. Lock in your rate and save big.
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <PlanCard
            title="Single Professional"
            subtitle="Best for individual selectors"
            price={professionalPrice}
            features={[
              "Training modules",
              "NOVA Help — AI voice coach",
              "NOVA Trainer — ES3 voice simulation",
              "Common Mistakes coaching",
              "Leaderboard",
              "Selector Breaking News community",
            ]}
            buttonText="Choose Single Professional"
            href="/choose-plan"
          />
          <PlanCard
            title="Company"
            subtitle="Best for teams and warehouse operations"
            highlight
            price={companyPrice}
            features={[
              "Everything in Single Professional",
              "Unlimited team members",
              "Trainer Dashboard",
              "Supervisor Dashboard",
              "Team workflow tools",
              "Assignment management",
              "Live tracking",
            ]}
            buttonText="Choose Company"
            href="/choose-plan"
          />
        </div>

        {/* Comparison note */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-bold text-white text-base">Single Professional</p>
              <p className="text-slate-400">Monthly: <span className="text-white font-bold">$25/month</span></p>
              <p className="text-slate-400">Yearly: <span className="text-white font-bold">$240/year</span> <span className="text-green-400">(save $60)</span></p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-white text-base">Company</p>
              <p className="text-slate-400">Weekly: <span className="text-white font-bold">$1,660/week</span></p>
              <p className="text-slate-400">Yearly: <span className="text-white font-bold">$75,000/year</span> <span className="text-green-400">(save ~$11,320)</span></p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">
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
            onClick={() => window.location.href = "/choose-plan"}
            className="mt-6 rounded-2xl bg-yellow-400 px-8 py-3 font-black text-slate-950 hover:bg-yellow-300 transition"
          >
            Get Started
          </button>
        </div>

      </div>
    </div>
  );
}
