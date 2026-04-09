import { useLocation } from "wouter";

export default function ChoosePlanPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">

        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400">Subscription</p>
          <h1 className="mt-3 text-5xl font-black">Choose Your Access Plan</h1>
          <p className="mt-4 text-lg text-slate-300">
            Pick the plan that fits how you want to use PickSmart NOVA.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
            <p className="font-semibold text-yellow-400">Single Professional</p>
            <h2 className="mt-3 text-3xl font-black">For Individual Selectors</h2>
            <p className="mt-3 text-slate-300">Monthly or yearly access for one professional user.</p>

            <div className="mt-6 space-y-2 text-slate-300">
              <p>• $25 monthly</p>
              <p>• $250 yearly</p>
              <p>• Training</p>
              <p>• NOVA Help</p>
              <p>• NOVA Trainer</p>
              <p>• Common Mistakes</p>
              <p>• Leaderboard</p>
              <p>• Selector Breaking News</p>
            </div>

            <button
              onClick={() => navigate("/checkout/personal?billing=monthly")}
              className="mt-8 w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 transition hover:bg-yellow-300"
            >
              Continue Professional
            </button>
          </div>

          <div className="rounded-3xl border border-yellow-400 bg-slate-900 p-8 shadow-xl">
            <p className="font-semibold text-yellow-400">Company Unlimited</p>
            <h2 className="mt-3 text-3xl font-black">For Teams and Operations</h2>
            <p className="mt-3 text-slate-300">Weekly, monthly, or yearly unlimited company access.</p>

            <div className="mt-6 space-y-2 text-slate-300">
              <p>• $1,600/year</p>
              <p>• Unlimited users</p>
              <p>• Trainer Dashboard</p>
              <p>• Supervisor Dashboard</p>
            </div>

            <p className="mt-4 text-sm text-red-300">
              Users & Access and Owner stay private to owner only.
            </p>

            <button
              onClick={() => navigate("/checkout/company?billing=weekly")}
              className="mt-8 w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 transition hover:bg-yellow-300"
            >
              Continue Company
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
