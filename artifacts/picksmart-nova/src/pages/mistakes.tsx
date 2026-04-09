import { useLocation } from "wouter";
import { MISTAKES } from "@/data/mistakesData";
import { useProgressStore } from "@/lib/progressStore";
import { Headphones, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import LockedAction from "@/components/paywall/LockedAction";

const RISK_COLORS = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  low: "bg-green-500/10 text-green-400 border-green-500/30",
};

const RISK_BADGE_COLORS = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-400 text-slate-950",
  low: "bg-green-500 text-white",
};

const CATEGORY_ICONS: Record<string, typeof AlertTriangle> = {
  Accuracy: AlertTriangle,
  "Pallet Quality": ShieldAlert,
  Performance: Headphones,
  "Safety & Health": ShieldAlert,
  "Safety & Skills": ShieldAlert,
  Mindset: CheckCircle2,
};

export default function CommonMistakesPage() {
  const { t } = useTranslation();
  const { mistakeProgress } = useProgressStore();
  const [, navigate] = useLocation();

  const totalPassed = Object.values(mistakeProgress).filter(m => m.passed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500 mb-5">
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-black text-white mb-3">{t("mistakes.heading")}</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          {t("mistakes.subtitle")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3 justify-center text-sm">
          <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <span className="text-yellow-400 font-black">14</span> {t("mistakes.count").replace("14 ", "")}
          </div>
          <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <span className="text-yellow-400 font-black">{totalPassed}</span> {t("mistakes.coached")}
          </div>
          <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {t("mistakes.novaCoaching")}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {MISTAKES.map((mistake, index) => {
            const mp = mistakeProgress[mistake.id];
            const isPassed = mp?.passed ?? false;
            const isStarted = mp?.started ?? false;
            const Icon = CATEGORY_ICONS[mistake.category] ?? AlertTriangle;

            return (
              <div
                key={mistake.id}
                className={`rounded-3xl border bg-slate-900 flex flex-col overflow-hidden transition-all hover:border-slate-700 ${
                  isPassed ? "border-green-500/30" : "border-slate-800"
                }`}
              >
                {/* Card header */}
                <div className={`px-5 py-5 flex items-center justify-between border-b border-slate-800 ${RISK_COLORS[mistake.riskLevel]}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${RISK_BADGE_COLORS[mistake.riskLevel]}`}>
                      {index + 1}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-widest capitalize border px-2 py-0.5 rounded-full ${RISK_COLORS[mistake.riskLevel]}`}>
                      {mistake.riskLevel} {t("mistakes.risk")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPassed && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    <Icon className="h-5 w-5 opacity-60" />
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                    {mistake.category}
                  </p>
                  <h3 className="text-lg font-black text-white mb-3 leading-tight">
                    {mistake.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span>{mistake.fixSteps.length} {t("mistakes.fixSteps")}</span>
                    <span>·</span>
                    <span>{mistake.questions.length} {t("mistakes.questions")}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Headphones className="h-3 w-3" /> {t("mistakes.novaCoached")}</span>
                  </div>

                  {mp && (
                    <div className="mb-3">
                      {isPassed ? (
                        <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          {t("mistakes.passedScore", { score: mp.testScore, total: mp.totalQuestions })}
                        </div>
                      ) : isStarted ? (
                        <div className="text-sm text-yellow-400 font-semibold">{t("mistakes.inProgress")}</div>
                      ) : null}
                    </div>
                  )}

                  <div className="mt-auto">
                    <LockedAction
                      onAllowedClick={() => navigate(`/mistakes/coaching/${mistake.id}`)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-800 text-white font-bold border border-slate-700 hover:border-yellow-400 hover:text-yellow-400 transition-all active:scale-[0.98] text-sm cursor-pointer select-none"
                    >
                      <Headphones className="h-4 w-4" />
                      {isPassed
                        ? t("mistakes.replayCoaching")
                        : isStarted
                        ? t("mistakes.continueCoaching")
                        : t("mistakes.startCoaching")}
                    </LockedAction>
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
