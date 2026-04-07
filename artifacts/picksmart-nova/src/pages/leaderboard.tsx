import { useProgressStore } from "@/lib/progressStore";
import { SEEDED_LEADERBOARD } from "@/data/scoringRules";
import { Trophy, Medal, Star, Zap } from "lucide-react";

interface LeaderboardEntry {
  userId: string;
  name: string;
  role: string;
  totalPoints: number;
  lessonsCompleted: number;
  modulesCompleted: number;
  mistakesCompleted: number;
  simulationScore: number;
  avgLessonScore: number;
  avgMistakeScore: number;
  joinedWeeksAgo: number;
  isYou?: boolean;
}

const MEDAL_CONFIG = [
  { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { icon: Medal, color: "text-slate-300", bg: "bg-slate-300/10" },
  { icon: Medal, color: "text-amber-600", bg: "bg-amber-600/10" },
];

export default function LeaderboardPage() {
  const { getTotalPoints, getLessonsCompleted, getMistakesCompleted, simulationCompleted, lastSimulationScore, getAvgLessonScore } = useProgressStore();

  const myEntry: LeaderboardEntry = {
    userId: "u-001",
    name: "You",
    role: "selector",
    totalPoints: getTotalPoints(),
    lessonsCompleted: getLessonsCompleted(),
    modulesCompleted: getLessonsCompleted(),
    mistakesCompleted: getMistakesCompleted(),
    simulationScore: simulationCompleted ? lastSimulationScore : 0,
    avgLessonScore: getAvgLessonScore(),
    avgMistakeScore: 0,
    joinedWeeksAgo: 0,
    isYou: true,
  };

  const allEntries: LeaderboardEntry[] = [...SEEDED_LEADERBOARD.map(e => ({ ...e, isYou: false })), myEntry];

  // Sort by points desc, then lessons, then modules
  const sorted = [...allEntries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.lessonsCompleted !== a.lessonsCompleted) return b.lessonsCompleted - a.lessonsCompleted;
    return b.modulesCompleted - a.modulesCompleted;
  });

  const myRank = sorted.findIndex(e => e.isYou) + 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 mb-5">
          <Trophy className="h-8 w-8 text-slate-950" />
        </div>
        <h1 className="text-4xl font-black text-white mb-3">Selector Leaderboard</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Top performers ranked by total training points. Earn points by passing lessons, completing mistake coaching, and finishing the NOVA simulation.
        </p>
        {myEntry.totalPoints > 0 && (
          <div className="mt-5 inline-flex items-center gap-3 px-5 py-3 rounded-full bg-yellow-400/10 border border-yellow-400/30">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-300 font-bold text-sm">You are ranked #{myRank} with {myEntry.totalPoints.toLocaleString()} points</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Points legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Lesson Pass", pts: "+100 pts" },
            { label: "Perfect Score", pts: "+25 pts" },
            { label: "Mistake Coaching", pts: "+60 pts" },
            { label: "Simulation", pts: "+150 pts" },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center">
              <p className="text-yellow-400 font-black text-sm">{item.pts}</p>
              <p className="text-slate-500 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Leaderboard list */}
        <div className="space-y-3">
          {sorted.map((entry, index) => {
            const rank = index + 1;
            const medal = MEDAL_CONFIG[index];
            const MedalIcon = medal?.icon ?? Star;
            const medalColor = medal?.color ?? "text-slate-500";
            const medalBg = medal?.bg ?? "bg-slate-800";

            return (
              <div
                key={entry.userId}
                className={`rounded-2xl border p-5 flex items-center gap-4 transition-all ${
                  entry.isYou
                    ? "border-yellow-400/50 bg-yellow-400/5"
                    : rank <= 3
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                {/* Rank */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${rank <= 3 ? medalBg : "bg-slate-800"}`}>
                  {rank <= 3 ? (
                    <MedalIcon className={`h-5 w-5 ${medalColor}`} />
                  ) : (
                    <span className="text-slate-400 font-black text-sm">#{rank}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`font-black text-base truncate ${entry.isYou ? "text-yellow-300" : "text-white"}`}>
                      {entry.name}
                      {entry.isYou && <span className="ml-2 text-xs font-bold bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full">You</span>}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 capitalize">
                    {entry.lessonsCompleted} lessons · {entry.mistakesCompleted} coaching · {entry.simulationScore > 0 ? `${entry.simulationScore}% sim` : "no sim"}
                  </p>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <p className={`text-xl font-black ${rank === 1 ? "text-yellow-400" : entry.isYou ? "text-yellow-300" : "text-white"}`}>
                    {entry.totalPoints.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">points</p>
                </div>

                {/* Avg score */}
                <div className="hidden sm:block text-right shrink-0 min-w-[60px]">
                  <p className={`text-lg font-black ${entry.avgLessonScore >= 90 ? "text-green-400" : entry.avgLessonScore >= 75 ? "text-yellow-400" : "text-slate-400"}`}>
                    {entry.avgLessonScore > 0 ? `${entry.avgLessonScore}%` : "—"}
                  </p>
                  <p className="text-xs text-slate-500">avg score</p>
                </div>
              </div>
            );
          })}
        </div>

        {myEntry.totalPoints === 0 && (
          <div className="mt-8 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-6 text-center">
            <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <p className="font-black text-white text-lg mb-2">You haven't scored yet</p>
            <p className="text-slate-400 text-sm mb-4">
              Complete training lessons and mistake coaching sessions to earn points and climb the leaderboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
