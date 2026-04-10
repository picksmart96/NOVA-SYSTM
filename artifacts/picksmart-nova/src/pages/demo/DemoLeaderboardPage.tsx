import { DEMO_LEADERBOARD } from "@/data/demoWarehouseData";
import { Trophy, Medal, Flame, Zap, Target } from "lucide-react";

const MEDAL = [
  { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  { icon: Medal,  color: "text-slate-300",  bg: "bg-slate-300/10 border-slate-700" },
  { icon: Medal,  color: "text-amber-600",  bg: "bg-amber-600/10 border-amber-700/30" },
];

export default function DemoLeaderboardPage() {
  const top3 = DEMO_LEADERBOARD.slice(0, 3);
  const rest = DEMO_LEADERBOARD.slice(3);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 mb-5">
          <Trophy className="h-8 w-8 text-slate-950" />
        </div>
        <h1 className="text-3xl font-black">Demo Leaderboard</h1>
        <p className="mt-2 text-slate-400">Demo Distribution Center · Live picking performance</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-3">
          {top3.map((entry, i) => {
            const M = MEDAL[i];
            const Icon = M.icon;
            return (
              <div key={entry.rank} className={`rounded-2xl border ${M.bg} p-4 text-center`}>
                <div className={`flex justify-center mb-2`}>
                  <Icon className={`h-6 w-6 ${M.color}`} />
                </div>
                <p className="font-bold text-white text-sm leading-tight">{entry.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{entry.novaId}</p>
                <p className={`text-2xl font-black mt-2 ${M.color}`}>{entry.rate}%</p>
                <p className="text-xs text-slate-400 mt-0.5">Rate · {entry.accuracy}% acc</p>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-orange-400">
                  <Flame className="h-3 w-3" />
                  <span>{entry.streak}d streak</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
            <span>#</span>
            <span>Selector</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Acc</span>
            <span className="text-right">Streak</span>
          </div>
          {DEMO_LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 items-center px-5 py-3.5 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/40 transition"
            >
              <span className="text-sm font-bold text-slate-500">#{entry.rank}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                <p className="text-xs text-slate-500">{entry.level}</p>
              </div>
              <div className="flex items-center gap-1 text-right">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">{entry.rate}%</span>
              </div>
              <div className="flex items-center gap-1 text-right">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">{entry.accuracy}%</span>
              </div>
              <div className="flex items-center gap-1 text-right">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-sm font-bold text-orange-400">{entry.streak}d</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600">Demo data — not real selector performance</p>
      </div>
    </div>
  );
}
