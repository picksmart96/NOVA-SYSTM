import { useState } from "react";
import { useLocation } from "wouter";

export default function PricingPage() {
  const [, navigate] = useLocation();
  const [singleBilling, setSingleBilling] = useState<"monthly" | "yearly">("monthly");
  const [companyBilling, setCompanyBilling] = useState<"weekly" | "monthly" | "yearly">("weekly");

  const singlePrice =
    singleBilling === "monthly"
      ? { price: "$25", billing: "per month" }
      : { price: "$250", billing: "per year" };

  const companyPrice =
    companyBilling === "weekly"
      ? { price: "$400", billing: "per week" }
      : companyBilling === "monthly"
      ? { price: "$1,600", billing: "per month" }
      : { price: "$1,600", billing: "per year" };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">

        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400">Pricing</p>
          <h1 className="mt-3 text-5xl font-black">Invest in Your Career</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-300">
            Start with professional individual access or unlock full company operations with unlimited team tools.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* Professional Single */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-yellow-400 font-semibold">Best for individual selectors</p>
                <h2 className="mt-2 text-3xl font-black">Professional Single</h2>
              </div>
              <div className="inline-flex rounded-2xl border border-slate-700 bg-slate-950 p-1">
                <button
                  onClick={() => setSingleBilling("monthly")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    singleBilling === "monthly" ? "bg-yellow-400 text-slate-950" : "text-slate-300"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSingleBilling("yearly")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    singleBilling === "yearly" ? "bg-yellow-400 text-slate-950" : "text-slate-300"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-5xl font-black text-white">{singlePrice.price}</p>
              <p className="mt-2 text-slate-400">{singlePrice.billing}</p>
            </div>

            <div className="mt-6 space-y-3 text-slate-300">
              <p>• Training access</p>
              <p>• NOVA Help</p>
              <p>• NOVA Trainer</p>
              <p>• Common Mistakes</p>
              <p>• Leaderboard</p>
              <p>• Selector Breaking News</p>
              <p>• Monthly or yearly billing</p>
            </div>

            <button
              onClick={() => navigate(`/checkout/personal?billing=${singleBilling}`)}
              className="mt-8 w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 transition hover:bg-yellow-300"
            >
              Choose Professional
            </button>
          </div>

          {/* Company Unlimited */}
          <div className="rounded-3xl border border-yellow-400 bg-slate-900 p-8 shadow-xl">
            <div className="mb-4 inline-flex rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-300">
              Unlimited Access
            </div>

            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-yellow-400 font-semibold">Best for teams and warehouse operations</p>
                <h2 className="mt-2 text-3xl font-black">Company Unlimited</h2>
              </div>
              <div className="inline-flex rounded-2xl border border-slate-700 bg-slate-950 p-1">
                <button
                  onClick={() => setCompanyBilling("weekly")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    companyBilling === "weekly" ? "bg-yellow-400 text-slate-950" : "text-slate-300"
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setCompanyBilling("monthly")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    companyBilling === "monthly" ? "bg-yellow-400 text-slate-950" : "text-slate-300"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCompanyBilling("yearly")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    companyBilling === "yearly" ? "bg-yellow-400 text-slate-950" : "text-slate-300"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-5xl font-black text-white">{companyPrice.price}</p>
              <p className="mt-2 text-slate-400">{companyPrice.billing}</p>
            </div>

            <p className="mt-4 text-sm text-yellow-300">Full company access with unlimited team use.</p>

            <div className="mt-6 space-y-3 text-slate-300">
              <p>• Everything in Professional Single</p>
              <p>• Trainer Dashboard</p>
              <p>• Supervisor Dashboard</p>
              <p>• Unlimited company users</p>
              <p>• Unlimited training and workflow access</p>
              <p>• Weekly, monthly, or yearly billing</p>
            </div>

            <p className="mt-5 text-sm text-red-300">
              Users & Access and Owner controls remain private to owner only.
            </p>

            <button
              onClick={() => navigate(`/checkout/company?billing=${companyBilling}`)}
              className="mt-8 w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 transition hover:bg-yellow-300"
            >
              Choose Company
            </button>
          </div>
        </div>

        <div className="mt-14 rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-6 space-y-4 text-slate-300">
            <p><strong>Is Home public?</strong> Yes. Home stays public.</p>
            <p><strong>Can I choose monthly or yearly as a single user?</strong> Yes.</p>
            <p><strong>Can Company choose weekly, monthly, or yearly?</strong> Yes.</p>
            <p><strong>Can Company users access Users & Access?</strong> No. That stays owner-only.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
