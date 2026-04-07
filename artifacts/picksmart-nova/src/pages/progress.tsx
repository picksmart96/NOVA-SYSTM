import { Link } from "wouter";
import { useProgressStore } from "@/lib/progressStore";
import { LESSON_CONTENT } from "@/data/lessonContent";
import { MISTAKES } from "@/data/mistakesData";
import { Activity, Trophy, Target, BookOpen, AlertTriangle, Zap, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProgressPage() {
  const { t } = useTranslation();
  const {
    progress,
    mistakeProgress,
    simulationCompleted,
    lastSimulationScore,
    getTotalPoints,
    getLessonsCompleted,
    getMistakesCompleted,
    getAvgLessonScore,
  } = useProgressStore();

  const totalPoints = getTotalPoints();
  const lessonsCompleted = getLessonsCompleted();
  const mistakesCompleted = getMistakesCompleted();
  const avgLessonScore = getAvgLessonScore();

  const totalLessons = LESSON_CONTENT.length;
  const totalMistakes = MISTAKES.length;

  const lessonPercent = Math.round((lessonsCompleted / totalLessons) * 100);
  const mistakePercent = Math.round((mistakesCompleted / totalMistakes) * 100);

  const STAT_TILES = [
    {
      icon: Trophy,
      label: t("progress.totalPoints"),
      value: totalPoints.toLocaleString(),
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      icon: BookOpen,
      label: t("progress.lessonsPassed"),
      value: `${lessonsCompleted} / ${totalLessons}`,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      icon: AlertTriangle,
      label: t("progress.mistakesCoached"),
      value: `${mistakesCompleted} / ${totalMistakes}`,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      icon: Target,
      label: t("progress.avgLessonScore"),
      value: avgLessonScore ? `${avgLessonScore}%` : "—",
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center">
              <Activity className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">{t("progress.heading")}</h1>
              <p className="text-slate-400">{t("progress.subtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_TILES.map(tile => (
            <div key={tile.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className={`w-10 h-10 rounded-xl ${tile.bg} flex items-center justify-center mb-3`}>
                <tile.icon className={`h-5 w-5 ${tile.color}`} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{tile.label}</p>
              <p className={`text-2xl font-black ${tile.color}`}>{tile.value}</p>
            </div>
          ))}
        </div>

        {/* Simulation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="font-black text-white text-lg">{t("progress.novaSimulation")}</p>
              <p className="text-slate-400 text-sm">
                {simulationCompleted
                  ? t("progress.simulationCompleted", { score: lastSimulationScore })
                  : t("progress.notYetCompleted")}
              </p>
            </div>
          </div>
          {simulationCompleted ? (
            <div className="text-right">
              <p className="text-purple-400 font-black text-xl">+150 pts</p>
              {lastSimulationScore >= 100 && <p className="text-yellow-400 text-xs font-bold">{t("progress.goldBonus")}</p>}
            </div>
          ) : (
            <Link href="/nova-trainer" className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-sm hover:bg-purple-500/20 transition">
              {t("progress.startSimulation")}
            </Link>
          )}
        </div>

        {/* Lessons progress */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-400" /> {t("progress.trainingLessons")}
            </h2>
            <span className="text-sm font-bold text-slate-400">{lessonPercent}% {t("progress.complete")}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 mb-5 overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${lessonPercent}%` }} />
          </div>
          <div className="space-y-3">
            {LESSON_CONTENT.map((lesson, i) => {
              const p = progress[lesson.moduleId];
              const isPassed = p?.passed ?? false;
              const isStarted = p?.started ?? false;
              const score = p?.testScore ?? 0;
              const total = p?.totalQuestions ?? 1;
              const perfect = isPassed && score === total;

              return (
                <div key={lesson.moduleId} className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${isPassed ? "border-green-500/30 bg-green-500/5" : "border-slate-800 bg-slate-900"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${isPassed ? "bg-green-500 text-white" : isStarted ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-500"}`}>
                      {isPassed ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{lesson.moduleTitle}</p>
                      <p className="text-xs text-slate-500">{lesson.category} · {lesson.difficulty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isPassed && (
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-sm">{score}/{total}</p>
                        {perfect && <p className="text-yellow-400 text-xs font-bold">{t("progress.perfect")}</p>}
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isPassed ? "bg-green-500/20 text-green-400" : isStarted ? "bg-yellow-400/20 text-yellow-400" : "bg-slate-800 text-slate-500"}`}>
                      {isPassed ? t("progress.passed") : isStarted ? t("progress.started") : t("progress.notStarted")}
                    </span>
                    <Link href={`/training/lesson/${lesson.moduleId}`} className="text-xs text-slate-500 hover:text-yellow-400 transition">
                      {isPassed ? t("progress.replay") : t("progress.start")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mistakes progress */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" /> {t("progress.mistakeCoaching")}
            </h2>
            <span className="text-sm font-bold text-slate-400">{mistakePercent}% {t("progress.complete")}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 mb-5 overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${mistakePercent}%` }} />
          </div>
          <div className="space-y-3">
            {MISTAKES.map((mistake, i) => {
              const mp = mistakeProgress[mistake.id];
              const isPassed = mp?.passed ?? false;
              const isStarted = mp?.started ?? false;
              const score = mp?.testScore ?? 0;
              const total = mp?.totalQuestions ?? 1;

              return (
                <div key={mistake.id} className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${isPassed ? "border-green-500/30 bg-green-500/5" : "border-slate-800 bg-slate-900"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${isPassed ? "bg-green-500 text-white" : isStarted ? "bg-orange-400 text-white" : "bg-slate-800 text-slate-500"}`}>
                      {isPassed ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{mistake.title}</p>
                      <p className="text-xs text-slate-500">{mistake.category} · {mistake.riskLevel} {t("mistakes.risk")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isPassed && <p className="text-green-400 font-bold text-sm">{score}/{total}</p>}
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isPassed ? "bg-green-500/20 text-green-400" : isStarted ? "bg-orange-400/20 text-orange-400" : "bg-slate-800 text-slate-500"}`}>
                      {isPassed ? t("progress.passed") : isStarted ? t("progress.started") : t("progress.notStarted")}
                    </span>
                    <Link href={`/mistakes/coaching/${mistake.id}`} className="text-xs text-slate-500 hover:text-yellow-400 transition">
                      {isPassed ? t("progress.replay") : t("progress.start")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
