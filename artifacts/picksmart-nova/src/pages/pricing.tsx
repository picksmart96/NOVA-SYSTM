import { useLocation } from "wouter";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

interface PlanCardProps {
  title: string;
  subtitle: string;
  features: string[];
  buttonText: string;
  href: string;
  highlight?: boolean;
}

function PlanCard({ title, subtitle, features, buttonText, href, highlight }: PlanCardProps) {
  const [, navigate] = useLocation();
  return (
    <div className={`relative flex flex-col rounded-3xl border p-8 shadow-xl ${
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
  { q: "Can Company users access Owner tools?", a: "No. Owner tools and Users & Access remain private to the owner account only." },
  { q: "Is the Home page public?", a: "Yes. Home and Pricing are always public. Training tools require a subscription." },
  { q: "What is NOVA Trainer?", a: "NOVA Trainer is an ES3-style voice-directed picking simulation that trains selectors to respond correctly in a warehouse environment." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-14">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.22em]">Pricing</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight">
            Choose the Access That Fits You
          </h1>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            PickSmart NOVA gives selectors and warehouse teams the tools to train, improve, and operate with confidence.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <PlanCard
            title="Personal"
            subtitle="Best for individual selectors"
            features={[
              "Training modules",
              "NOVA Help — AI voice coach",
              "NOVA Trainer — ES3 voice simulation",
              "Common Mistakes coaching",
              "Leaderboard",
              "Selector Nation community",
            ]}
            buttonText="Choose Personal"
            href="/choose-plan"
          />
          <PlanCard
            title="Company"
            subtitle="Best for teams and warehouse operations"
            highlight
            features={[
              "Everything in Personal",
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

        {/* FAQ */}
        <div className="mt-14 rounded-3xl border border-slate-800 bg-slate-900 p-8">
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
