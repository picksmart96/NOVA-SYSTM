import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, Link } from "wouter";
import { getMistakeById } from "@/data/mistakesData";
import { useProgressStore } from "@/lib/progressStore";
import { NovaLessonGuide } from "@/components/training/NovaLessonGuide";
import { LessonTest } from "@/components/training/LessonTest";
import { ArrowLeft, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";

type Phase = "welcome" | "coaching" | "test";

function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); onDone?.(); };
      utterance.onerror = () => { setIsSpeaking(false); onDone?.(); };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(true);
      const words = text.trim().split(/\s+/).length;
      setTimeout(() => { setIsSpeaking(false); onDone?.(); }, Math.max(1200, (words / 140) * 60000));
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stopSpeaking };
}

const RISK_COLORS = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  low: "bg-green-500/10 text-green-400 border-green-500/30",
};

export default function MistakeCoachingPage() {
  const [, params] = useRoute("/mistakes/coaching/:id");
  const mistakeId = params?.id ?? "";
  const mistake = getMistakeById(mistakeId);
  const { startMistakeCoaching, completeMistakeCoaching } = useProgressStore();

  const [phase, setPhase] = useState<Phase>("welcome");
  const [novaMessage, setNovaMessage] = useState("");
  const [coachingStep, setCoachingStep] = useState(0);

  const { isSpeaking, speak, stopSpeaking } = useSpeech();
  const mountedRef = useRef(true);

  const ALL_STEPS = mistake
    ? [
        { title: "Why It Happens", content: mistake.whyItHappens },
        { title: "What Goes Wrong", content: mistake.whatGoesWrong },
        ...mistake.fixSteps.map((s, i) => ({ title: `Fix Step ${i + 1}`, content: s })),
        { title: "Coaching Script", content: mistake.coachingScript },
      ]
    : [];

  useEffect(() => {
    mountedRef.current = true;
    if (!mistake) return;
    const msg = mistake.novaIntro;
    setNovaMessage(msg);
    speak(msg);
    startMistakeCoaching(mistakeId);
    return () => { mountedRef.current = false; stopSpeaking(); };
  }, [mistakeId]);

  if (!mistake) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-8 text-center">
        <p className="text-2xl font-black text-white mb-4">Coaching session not found</p>
        <Link href="/mistakes" className="text-yellow-400 hover:text-yellow-300 underline">
          Back to Common Mistakes
        </Link>
      </div>
    );
  }

  const totalSteps = ALL_STEPS.length;
  const progressPercent =
    phase === "welcome" ? 0 : phase === "test" ? 100 : Math.round(((coachingStep + 1) / totalSteps) * 90);

  const handleReady = () => {
    stopSpeaking();
    const msg = "Coaching starting.";
    setNovaMessage(msg);
    speak(msg, () => {
      const step = ALL_STEPS[0];
      if (step) { setNovaMessage(step.content); speak(step.content); }
    });
    setPhase("coaching");
    setCoachingStep(0);
  };

  const handleNextStep = () => {
    stopSpeaking();
    const next = coachingStep + 1;
    if (next < totalSteps) {
      setCoachingStep(next);
      const step = ALL_STEPS[next];
      setNovaMessage(step.content);
      speak(step.content);
    } else {
      const msg = "Coaching complete. Start test.";
      setNovaMessage(msg);
      speak(msg);
      setPhase("test");
    }
  };

  const handleTestComplete = (score: number, total: number) => {
    completeMistakeCoaching(mistakeId, score, total);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            href="/mistakes"
            onClick={stopSpeaking}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm font-medium shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Mistakes
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 truncate">
              {mistake.category}
            </p>
            <p className="font-black text-white text-sm truncate">{mistake.title}</p>
          </div>
          <span
            className={`px-2 py-1 rounded-md text-xs font-bold uppercase border shrink-0 capitalize ${RISK_COLORS[mistake.riskLevel]}`}
          >
            {mistake.riskLevel} risk
          </span>
        </div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>
              {phase === "welcome"
                ? "Ready to start"
                : phase === "test"
                ? "Test"
                : `${ALL_STEPS[coachingStep]?.title ?? ""}`}
            </span>
            <span>{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <NovaLessonGuide message={novaMessage || mistake.novaIntro} isSpeaking={isSpeaking} />

        {/* Welcome phase */}
        {phase === "welcome" && (
          <button
            onClick={handleReady}
            className="w-full py-5 rounded-2xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20 active:scale-[0.98]"
          >
            Ready
          </button>
        )}

        {/* Coaching phase */}
        {phase === "coaching" && (
          <div className="space-y-4">
            {ALL_STEPS.map((step, i) => {
              const isActive = i === coachingStep;
              const isDone = i < coachingStep;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 transition-all duration-300 ${
                    isActive
                      ? "border-yellow-400/50 bg-yellow-400/5"
                      : isDone
                      ? "border-green-500/20 bg-green-500/5 opacity-70"
                      : "border-slate-800 bg-slate-900 opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isDone
                          ? "bg-green-500"
                          : isActive
                          ? "bg-yellow-400"
                          : "bg-slate-800"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : (
                        <span className={`text-xs font-black ${isActive ? "text-slate-950" : "text-slate-500"}`}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <h3 className={`font-black text-base ${isActive ? "text-white" : "text-slate-400"}`}>
                      {step.title}
                    </h3>
                  </div>
                  {(isActive || isDone) && (
                    <p className="text-slate-300 leading-relaxed pl-10">{step.content}</p>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleNextStep}
              className="w-full py-4 rounded-2xl bg-slate-800 text-white font-bold text-lg border border-slate-700 hover:border-yellow-400 hover:text-yellow-400 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {coachingStep < totalSteps - 1 ? (
                <>Next <ChevronRight className="h-5 w-5" /></>
              ) : (
                <>Start Test <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
          </div>
        )}

        {/* Test phase */}
        {phase === "test" && (
          <LessonTest
            moduleId={mistakeId}
            questions={mistake.questions}
            onComplete={handleTestComplete}
          />
        )}
      </div>
    </div>
  );
}
