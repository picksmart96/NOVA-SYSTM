import { MODULES } from "@/data/modules";
import { DEMO_SELECTORS_ONLY } from "@/data/demoWarehouseData";
import { BookOpen, CheckCircle2, Lock, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     "bg-green-500/20 text-green-300",
  intermediate: "bg-yellow-400/20 text-yellow-300",
  advanced:     "bg-rose-500/20 text-rose-300",
};

export default function DemoTrainingPage() {
  const sample = DEMO_SELECTORS_ONLY[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-yellow-400 p-2">
                <BookOpen className="h-5 w-5 text-slate-950" />
              </div>
              <div>
                <h1 className="text-2xl font-black">Training Modules</h1>
                <p className="text-sm text-slate-400">Demo selector: {sample.fullName} · {sample.novaId}</p>
              </div>
            </div>
          </div>

          {/* Progress summary */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-yellow-400">{sample.modulesCompleted}/{MODULES.length}</p>
              <p className="text-xs text-slate-500">Modules Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-400">{sample.trainingProgress}%</p>
              <p className="text-xs text-slate-500">Progress</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="h-2 rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-yellow-400 transition-all"
              style={{ width: `${sample.trainingProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map((mod, i) => {
            const completed = i < sample.modulesCompleted;
            const isNext = i === sample.modulesCompleted;
            const locked = !completed && !isNext && !mod.isFree;

            return (
              <div
                key={mod.id}
                className={`rounded-2xl border p-5 flex flex-col gap-3 transition ${
                  completed
                    ? "border-green-500/30 bg-green-500/5"
                    : isNext
                    ? "border-yellow-400/40 bg-yellow-400/5"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                      completed ? "bg-green-500/20 text-green-300" : isNext ? "bg-yellow-400/20 text-yellow-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {completed ? <CheckCircle2 className="h-5 w-5" /> : mod.number}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{mod.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{mod.category} · {mod.durationMinutes} min · {mod.lessons} lessons</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-bold ${DIFFICULTY_COLOR[mod.difficulty]}`}>
                    {mod.difficulty}
                  </span>
                </div>

                <p className="text-sm text-slate-300">{mod.description}</p>

                <div className="flex items-center justify-between mt-auto pt-1">
                  {completed ? (
                    <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  ) : locked ? (
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5" /> Locked
                    </span>
                  ) : isNext ? (
                    <span className="text-xs font-bold text-yellow-400">Up Next</span>
                  ) : (
                    <span className="text-xs text-slate-600">Available</span>
                  )}

                  <Link
                    href="/demo"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-yellow-400 transition"
                  >
                    {completed ? "Review" : "Start"} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">Demo data — not real training records</p>
      </div>
    </div>
  );
}
