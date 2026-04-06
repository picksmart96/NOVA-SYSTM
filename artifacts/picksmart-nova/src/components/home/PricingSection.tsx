import SectionHeading from "./SectionHeading";
import { pricingPlans } from "../../data/homepageData";
import { Link } from "wouter";

export default function PricingSection() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow="Simple Pricing"
          title="Invest in Your Career"
          subtitle="Start free or unlock everything with Pro. Most selectors make back the cost in their first week of better rates."
        />

        <div className="mt-12 grid lg:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.title}
              className={`rounded-3xl border p-8 shadow-xl ${
                plan.featured
                  ? "border-yellow-400 bg-slate-900 ring-1 ring-yellow-400"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              {plan.featured ? (
                <div className="mb-4 inline-flex rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-slate-950">
                  Most Popular
                </div>
              ) : null}

              <h3 className="text-2xl font-bold text-white">{plan.title}</h3>
              <p className="mt-2 text-slate-400">{plan.subtitle}</p>

              <div className="mt-6">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-slate-400 ml-1">{plan.suffix}</span>
              </div>

              <ul className="mt-6 space-y-3 text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-bold ${
                  plan.featured
                    ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                    : "border border-slate-700 text-white hover:border-yellow-400"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
