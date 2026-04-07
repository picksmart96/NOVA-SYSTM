import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, Link } from "wouter";
import { getLessonById } from "@/data/lessonContent";
import { useProgressStore } from "@/lib/progressStore";
import { NovaLessonGuide } from "@/components/training/NovaLessonGuide";
import { LessonStepCard } from "@/components/training/LessonStepCard";
import { LessonTest } from "@/components/training/LessonTest";
import { ArrowLeft, ChevronRight } from "lucide-react";

type Phase = "welcome" | "lesson" | "test";

function useSpeech() {
  const speakingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      speakingRef.current = true;
      setIsSpeaking(true);
      utterance.onend = () => {
        speakingRef.current = false;
        setIsSpeaking(false);
        if (onDone) onDone();
      };
      utterance.onerror = () => {
        speakingRef.current = false;
        setIsSpeaking(false);
        if (onDone) onDone();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback: simulate speaking duration
      setIsSpeaking(true);
      const words = text.trim().split(/\s+/).length;
      const ms = Math.max(1200, Math.round((words / 140) * 60 * 1000));
      setTimeout(() => {
        setIsSpeaking(false);
        if (onDone) onDone();
      }, ms);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stopSpeaking };
}

export default function LessonSessionPage() {
  const [, params] = useRoute("/training/lesson/:id");
  const moduleId = params?.id ?? "";
  const lesson = getLessonById(moduleId);

  const { startLesson, completeLesson } = useProgressStore();

  const [phase, setPhase] = useState<Phase>("welcome");
  const [currentStep, setCurrentStep] = useState(0);
  const [novaMessage, setNovaMessage] = useState("");

  const { isSpeaking, speak, stopSpeaking } = useSpeech();

  // On mount: welcome message
  useEffect(() => {
    if (!lesson) return;
    const msg = `Welcome to ${lesson.moduleTitle}. When you are ready, click Ready.`;
    setNovaMessage(msg);
    speak(msg);
    startLesson(moduleId);
  }, [moduleId]);

  // Cleanup speech on unmount
  useEffect(() => () => stopSpeaking(), []);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-8 text-center">
        <p className="text-2xl font-black text-white mb-4">Lesson not found</p>
        <Link href="/training" className="text-yellow-400 hover:text-yellow-300 underline">
          Back to Training
        </Link>
      </div>
    );
  }

  const totalSteps = lesson.steps.length;
  const progressPercent =
    phase === "welcome"
      ? 0
      : phase === "test"
      ? 100
      : Math.round(((currentStep + 1) / totalSteps) * 90);

  const handleReady = () => {
    stopSpeaking();
    const msg = "Lesson starting.";
    setNovaMessage(msg);
    speak(msg, () => {
      const step = lesson.steps[0];
      if (step) {
        const stepMsg = step.content;
        setNovaMessage(stepMsg);
        speak(stepMsg);
      }
    });
    setPhase("lesson");
    setCurrentStep(0);
  };

  const handleNextStep = () => {
    stopSpeaking();
    const next = currentStep + 1;
    if (next < totalSteps) {
      setCurrentStep(next);
      const step = lesson.steps[next];
      const msg = step.content;
      setNovaMessage(msg);
      speak(msg);
    } else {
      // Move to test
      const msg = "Lesson complete. Start test.";
      setNovaMessage(msg);
      speak(msg);
      setPhase("test");
    }
  };

  const handleTestComplete = (score: number, total: number) => {
    completeLesson(moduleId, score, total);
  };

  const handleRetry = () => {
    stopSpeaking();
    setPhase("welcome");
    setCurrentStep(0);
    const msg = `Welcome back to ${lesson.moduleTitle}. Click Ready to begin again.`;
    setNovaMessage(msg);
    speak(msg);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            href="/training"
            onClick={stopSpeaking}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm font-medium shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Training
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 truncate">
              {lesson.category}
            </p>
            <p className="font-black text-white text-sm truncate">{lesson.moduleTitle}</p>
          </div>
          <span
            className={`px-2 py-1 rounded-md text-xs font-bold uppercase shrink-0 ${
              lesson.isFree
                ? "bg-yellow-400 text-slate-950"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {lesson.isFree ? "FREE" : lesson.difficulty}
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
                : `Step ${currentStep + 1} of ${totalSteps}`}
            </span>
            <span>{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        {/* NOVA Guide */}
        <NovaLessonGuide message={novaMessage || `Welcome to ${lesson.moduleTitle}.`} isSpeaking={isSpeaking} />

        {/* Welcome phase: Ready button */}
        {phase === "welcome" && (
          <button
            onClick={handleReady}
            className="w-full py-5 rounded-2xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20 active:scale-[0.98]"
          >
            Ready
          </button>
        )}

        {/* Lesson phase: steps */}
        {phase === "lesson" && (
          <div className="space-y-4">
            {lesson.steps.map((step, i) => (
              <LessonStepCard
                key={step.id}
                stepNumber={i + 1}
                totalSteps={totalSteps}
                title={step.title}
                content={step.content}
                isActive={i === currentStep}
              />
            ))}

            <button
              onClick={handleNextStep}
              className="w-full py-4 rounded-2xl bg-slate-800 text-white font-bold text-lg border border-slate-700 hover:border-yellow-400 hover:text-yellow-400 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {currentStep < totalSteps - 1 ? (
                <>Next Step <ChevronRight className="h-5 w-5" /></>
              ) : (
                <>Finish Lesson <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
          </div>
        )}

        {/* Test phase */}
        {phase === "test" && (
          <LessonTest
            moduleId={moduleId}
            questions={lesson.questions}
            onComplete={handleTestComplete}
          />
        )}
      </div>
    </div>
  );
}
