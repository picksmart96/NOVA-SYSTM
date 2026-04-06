import { Link } from "wouter";

export default function HomeFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-2xl font-bold text-white">PickSmart Academy</h3>
          <p className="mt-3 max-w-xl text-slate-400">
            The #1 training platform for warehouse order selectors. Learn to pick
            faster, safer, and hit 100%+ rates from day one.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-semibold mb-3">Training</h4>
            <div className="space-y-2 text-slate-400">
              <Link href="/training" className="block hover:text-yellow-400">All Modules</Link>
              <Link href="/mistakes" className="block hover:text-yellow-400">Common Mistakes</Link>
              <Link href="/progress" className="block hover:text-yellow-400">Track Progress</Link>
              <Link href="/pricing" className="block hover:text-yellow-400">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">NOVA</h4>
            <div className="space-y-2 text-slate-400">
              <Link href="/nova" className="block hover:text-yellow-400">My Assignments</Link>
              <Link href="/leaderboard" className="block hover:text-yellow-400">Leaderboard</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
