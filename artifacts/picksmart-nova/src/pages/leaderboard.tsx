import { useState } from "react";
import { useProgressStore } from "@/lib/progressStore";
import { useAuthStore } from "@/lib/authStore";
import { usePerformanceStore } from "@/lib/performanceStore";
import { SEEDED_LEADERBOARD } from "@/data/scoringRules";
import { Trophy, Medal, Star, Zap, Target, Clock, TrendingUp, Plus, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function rateColor(rate: number) {
  if (rate >= 100) return "text-green-400";
  if (rate >= 90)  return "text-yellow-400";
  if (rate >= 80)  return "text-orange-400";
  return "text-red-400";
}

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuthStore();
  const { getTotalPoints, getLessonsCompleted, getMistakesCompleted, simulationCompleted, lastSimulationScore, getAvgLessonScore } = useProgressStore();
  const { logToday, setGoal, getRecentLogs, getTodayLog, getGoal, getWeekAvg } = usePerformanceStore();

  const username = currentUser?.username ?? "";

  // ── Performance tracker state ──────────────────────────────────────────────
  const [logRate,   setLogRate]   = useState("");
  const [logHours,  setLogHours]  = useState("");
  const [logNote,   setLogNote]   = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [saved,     setSaved]     = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);

  const todayLog   = getTodayLog(username);
  const recentLogs = getRecentLogs(username, 7);
  const currentGoal = getGoal(username);
  const weekAvg    = getWeekAvg(username);

  function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rate  = parseFloat(logRate);
    const hours = parseFloat(logHours);
    if (isNaN(rate) || rate < 0 || rate > 200) return;
    if (isNaN(hours) || hours < 0 || hours > 24) return;
    logToday(username, rate, hours, logNote.trim() || undefined);
    setLogRate(""); setLogHours(""); setLogNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleGoalSubmit(e: React.FormEvent) {
    e.preventDefault();
    const g = parseFloat(goalInput);
    if (isNaN(g) || g < 50 || g > 200) return;
    setGoal(username, g);
    setGoalInput("");
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 3000);
  }

  // ── Academy leaderboard (existing) ────────────────────────────────────────
  const myEntry: LeaderboardEntry = {
    userId: "u-001",
    name: t("leaderboard.you"),
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
        <h1 className="text-4xl font-black text-white mb-3">{t("leaderboard.heading")}</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          {t("leaderboard.subtitle")}
        </p>
        {myEntry.totalPoints > 0 && (
          <div className="mt-5 inline-flex items-center gap-3 px-5 py-3 rounded-full bg-yellow-400/10 border border-yellow-400/30">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-300 font-bold text-sm">
              {t("leaderboard.yourRank", { rank: myRank, points: myEntry.totalPoints.toLocaleString() })}
            </span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* ── MY PERFORMANCE TRACKER ─────────────────────────────────────── */}
        {currentUser && !currentUser.isDemoUser && (
          <div className="rounded-3xl border border-yellow-400/20 bg-slate-900 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="font-black text-white text-lg leading-none">My Performance Tracker</h2>
                <p className="text-slate-500 text-xs mt-0.5">Log your daily pick rate &amp; track your weekly goal</p>
              </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-2">

              {/* Log today */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-yellow-400" />
                  {todayLog ? "Update Today's Performance" : "Log Today's Performance"}
                </h3>

                {todayLog && (
                  <div className="mb-3 rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    <span className="text-green-300 text-sm">
                      Today logged — <strong>{todayLog.pickRate}%</strong> rate · <strong>{todayLog.hours}h</strong>
                    </span>
                  </div>
                )}

                <form onSubmit={handleLogSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Pick Rate %</label>
                      <input
                        type="number"
                        min="0" max="200" step="0.1"
                        value={logRate}
                        onChange={e => setLogRate(e.target.value)}
                        placeholder="e.g. 98"
                        className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Hours Worked</label>
                      <input
                        type="number"
                        min="0" max="24" step="0.5"
                        value={logHours}
                        onChange={e => setLogHours(e.target.value)}
                        placeholder="e.g. 8.5"
                        className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={logNote}
                    onChange={e => setLogNote(e.target.value)}
                    placeholder="Optional note (e.g. great day, leg sore...)"
                    maxLength={100}
                    className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-yellow-400 text-slate-950 font-bold py-2.5 text-sm hover:bg-yellow-300 transition flex items-center justify-center gap-2"
                  >
                    {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : "Save Today's Log"}
                  </button>
                </form>
              </div>

              {/* Weekly goal */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-400" />
                  Weekly Goal
                </h3>

                {currentGoal && (
                  <div className="mb-3 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 px-4 py-4">
                    <p className="text-xs text-slate-400 mb-1">This week's target</p>
                    <p className="text-3xl font-black text-yellow-400">{currentGoal.targetRate}%</p>
                    {weekAvg !== null && (
                      <p className={`text-sm font-bold mt-1 ${rateColor(weekAvg)}`}>
                        7-day avg: {weekAvg}%
                        {weekAvg >= currentGoal.targetRate
                          ? " ✓ On track!"
                          : ` (${currentGoal.targetRate - weekAvg}% to go)`}
                      </p>
                    )}
                  </div>
                )}

                <form onSubmit={handleGoalSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      {currentGoal ? "Update goal pick rate %" : "Set your goal pick rate %"}
                    </label>
                    <input
                      type="number"
                      min="50" max="200" step="1"
                      value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      placeholder={currentGoal ? `Current: ${currentGoal.targetRate}%` : "e.g. 100"}
                      className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-2xl border border-yellow-400/40 text-yellow-400 font-bold py-2.5 text-sm hover:bg-yellow-400/10 transition flex items-center justify-center gap-2"
                  >
                    {goalSaved ? <><CheckCircle2 className="h-4 w-4" /> Goal Set!</> : (currentGoal ? "Update Goal" : "Set Weekly Goal")}
                  </button>
                </form>
              </div>
            </div>

            {/* Recent history */}
            {recentLogs.length > 0 && (
              <div className="border-t border-slate-800 px-6 py-5">
                <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Recent Performance
                </h3>
                <div className="space-y-2">
                  {recentLogs.map((log) => (
                    <div key={log.date} className="flex items-center gap-3 rounded-xl bg-slate-950 border border-slate-800 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">{formatDate(log.date)}</p>
                        {log.note && <p className="text-xs text-slate-600 truncate mt-0.5">"{log.note}"</p>}
                      </div>
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div>
                          <p className={`text-lg font-black ${rateColor(log.pickRate)}`}>{log.pickRate}%</p>
                          <p className="text-xs text-slate-600">rate</p>
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-300">{log.hours}h</p>
                          <p className="text-xs text-slate-600">hours</p>
                        </div>
                        {currentGoal && (
                          <div className="w-8 flex items-center justify-center">
                            {log.pickRate >= currentGoal.targetRate
                              ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                              : <Target className="h-5 w-5 text-slate-600" />}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Points legend ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "lessonPass", pts: "+100 pts" },
            { key: "perfectScore", pts: "+25 pts" },
            { key: "mistakeCoaching", pts: "+60 pts" },
            { key: "simulation", pts: "+150 pts" },
          ].map(item => (
            <div key={item.key} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center">
              <p className="text-yellow-400 font-black text-sm">{item.pts}</p>
              <p className="text-slate-500 text-xs mt-0.5">{t(`leaderboard.${item.key}`)}</p>
            </div>
          ))}
        </div>

        {/* ── Leaderboard list ───────────────────────────────────────────── */}
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
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${rank <= 3 ? medalBg : "bg-slate-800"}`}>
                  {rank <= 3 ? (
                    <MedalIcon className={`h-5 w-5 ${medalColor}`} />
                  ) : (
                    <span className="text-slate-400 font-black text-sm">#{rank}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`font-black text-base truncate ${entry.isYou ? "text-yellow-300" : "text-white"}`}>
                      {entry.name}
                      {entry.isYou && (
                        <span className="ml-2 text-xs font-bold bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full">
                          {t("leaderboard.you")}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 capitalize">
                    {entry.lessonsCompleted} {t("leaderboard.lessons")} · {entry.mistakesCompleted} {t("leaderboard.coaching")} · {entry.simulationScore > 0 ? `${entry.simulationScore}% ${t("leaderboard.sim")}` : t("leaderboard.noSim")}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-xl font-black ${rank === 1 ? "text-yellow-400" : entry.isYou ? "text-yellow-300" : "text-white"}`}>
                    {entry.totalPoints.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">{t("leaderboard.points")}</p>
                </div>

                <div className="hidden sm:block text-right shrink-0 min-w-[60px]">
                  <p className={`text-lg font-black ${entry.avgLessonScore >= 90 ? "text-green-400" : entry.avgLessonScore >= 75 ? "text-yellow-400" : "text-slate-400"}`}>
                    {entry.avgLessonScore > 0 ? `${entry.avgLessonScore}%` : "—"}
                  </p>
                  <p className="text-xs text-slate-500">{t("leaderboard.avgScore")}</p>
                </div>
              </div>
            );
          })}
        </div>

        {myEntry.totalPoints === 0 && (
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-6 text-center">
            <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <p className="font-black text-white text-lg mb-2">{t("leaderboard.youHaventScored")}</p>
            <p className="text-slate-400 text-sm mb-4">{t("leaderboard.earnPoints")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
