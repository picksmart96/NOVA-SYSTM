import { Link } from "wouter";
import { LESSON_CONTENT } from "@/data/lessonContent";
import { useProgressStore } from "@/lib/progressStore";
import { Clock, BookOpen, Headphones, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const DIFFICULTY_COLORS = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/30",
  intermediate: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  advanced: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function ModulesPage() {
  const { t } = useTranslation();
  const { progress } = useProgressStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 mb-5">
          <BookOpen className="h-8 w-8 text-slate-950" />
        </div>
        <h1 className="text-4xl font-black text-white mb-3">{t("training.heading")}</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          {t("training.subtitle")}
        </p>
        <div className="mt-5 flex gap-4 justify-center text-sm">
          <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <span className="text-yellow-400 font-black">6</span> {t("training.modulesCount")}
          </div>
          <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <span className="text-yellow-400 font-black">
              {Object.values(progress).filter(p => p.passed).length}
            </span> {t("training.passed")}
          </div>
          <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {t("training.novaGuided")}
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {LESSON_CONTENT.map((lesson, index) => {
            const p = progress[lesson.moduleId];
            const isPassed = p?.passed ?? false;
            const isStarted = p?.started ?? false;

            return (
              <div
                key={lesson.moduleId}
                className={`rounded-3xl border bg-slate-900 flex flex-col overflow-hidden transition-all hover:border-slate-700 ${
                  isPassed ? "border-green-500/30" : "border-slate-800"
                }`}
              >
                {/* Card header band */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-950 px-6 py-8 flex items-center justify-between border-b border-slate-800">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                      {t("training.module")} {index + 1}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-xs font-bold capitalize ${
                        DIFFICULTY_COLORS[lesson.difficulty]
                      }`}
                    >
                      {lesson.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {lesson.isFree && (
                      <span className="px-3 py-1 rounded-full bg-yellow-400 text-slate-950 text-xs font-black">
                        {t("training.free")}
                      </span>
                    )}
                    {isPassed && (
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-white mb-2">{lesson.moduleTitle}</h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {lesson.durationMinutes} {t("training.min")}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {lesson.steps.length} {t("training.steps")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Headphones className="h-3 w-3" /> NOVA
                    </span>
                  </div>

                  {/* Progress indicator */}
                  {p && (
                    <div className="mb-4">
                      {isPassed ? (
                        <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          {t("training.passedScore", { score: p.testScore, total: p.totalQuestions })}
                        </div>
                      ) : isStarted ? (
                        <div className="text-sm text-yellow-400 font-semibold">{t("training.inProgress")}</div>
                      ) : null}
                    </div>
                  )}

                  <div className="mt-auto">
                    <Link
                      href={`/training/lesson/${lesson.moduleId}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300 transition-all active:scale-[0.98]"
                    >
                      <Headphones className="h-4 w-4" />
                      {isPassed
                        ? t("training.replayLesson")
                        : isStarted
                        ? t("training.continueLesson")
                        : t("training.startLesson")}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
