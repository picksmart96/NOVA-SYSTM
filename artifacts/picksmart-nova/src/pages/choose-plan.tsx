import { useLocation } from "wouter";

export default function ChoosePlanPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.22em]">Subscription</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black">Choose Your Access Plan</h1>
          <p className="mt-4 text-slate-400 text-lg">
            Pick the level that fits how you use PickSmart NOVA.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Personal */}
          <button
            onClick={() => navigate("/checkout/personal")}
            className="text-left rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-xl hover:border-yellow-400 transition group"
          >
            <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">Personal Use</p>
            <h2 className="mt-3 text-2xl font-black text-white">For Individual Selectors</h2>
            <p className="mt-2 text-slate-400 text-sm">Best for one person using training and NOVA tools.</p>
            <ul className="mt-5 space-y-2">
              {["Training", "NOVA Help", "NOVA Trainer", "Common Mistakes", "Leaderboard", "Selector Nation"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                  <span className="text-yellow-400">•</span> {f}
                </li>
              ))}
            </ul>
            <div className="mt-7 rounded-2xl bg-slate-800 group-hover:bg-yellow-400 group-hover:text-slate-950 px-5 py-3 text-center font-black transition">
              Continue Personal →
            </div>
          </button>

          {/* Company */}
          <button
            onClick={() => navigate("/checkout/company")}
            className="text-left rounded-3xl border border-yellow-400 bg-slate-900 p-8 shadow-xl hover:bg-yellow-400/5 transition group"
          >
            <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">Company</p>
            <h2 className="mt-3 text-2xl font-black text-white">For Teams and Operations</h2>
            <p className="mt-2 text-slate-400 text-sm">Best for warehouses, trainers, and supervisors.</p>
            <ul className="mt-5 space-y-2">
              {["Everything in Personal", "Trainer Dashboard", "Supervisor Dashboard", "Team workflow tools"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                  <span className="text-yellow-400">•</span> {f}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-red-400">Users & Access and Owner controls remain owner-only.</p>
            <div className="mt-5 rounded-2xl bg-yellow-400 text-slate-950 px-5 py-3 text-center font-black">
              Continue Company →
            </div>
          </button>

        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-yellow-400 hover:underline">Sign in</button>
        </p>

      </div>
    </div>
  );
}
