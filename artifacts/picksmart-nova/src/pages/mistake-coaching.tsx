import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { getMistakeById } from "@/data/mistakesData";
import { useProgressStore } from "@/lib/progressStore";
import { NovaLessonGuide } from "@/components/training/NovaLessonGuide";
import { ArrowLeft, CheckCircle2, Volume2, VolumeX, RotateCcw, ChevronRight } from "lucide-react";
import { useBilingualSpeech } from "@/hooks/useBilingualSpeech";

type Phase = "welcome" | "lesson" | "test";

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  low: "bg-green-500/10 text-green-400 border-green-500/30",
};

export default function MistakeCoachingPage() {
  const [, params] = useRoute("/mistakes/coaching/:id");
  const mistakeId = params?.id ?? "";
  const mistake = getMistakeById(mistakeId);
  const { startMistakeCoaching, completeMistakeCoaching, mistakeProgress } = useProgressStore();

  const [phase, setPhase] = useState<Phase>("welcome");
  const [novaMessage, setNovaMessage] = useState("");
  const { isSpeaking, muted, toggleMute, speak, stopSpeaking } = useBilingualSpeech();
  const mountedRef = useRef(true);

  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    if (!mistake) return;
    const msg = mistake.novaIntro;
    setNovaMessage(msg);
    speak(msg);
    startMistakeCoaching(mistakeId);
    return () => {
      mountedRef.current = false;
      stopSpeaking();
    };
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

  const progressPercent =
    phase === "welcome" ? 5 : phase === "test" ? 90 : submitted ? 100 : 50;

  const handleReady = () => {
    stopSpeaking();
    const msg = mistake.novaLine;
    setNovaMessage(msg);
    speak(msg);
    setPhase("lesson");
  };

  const handleStartTest = () => {
    stopSpeaking();
    const msg = "Coaching complete. Answer the questions to finish.";
    setNovaMessage(msg);
    speak(msg);
    setPhase("test");
  };

  const handleSelectAnswer = (qId: string, idx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const allAnswered = mistake.questions.every(q => answers[q.id] !== undefined && answers[q.id] !== null);

  const handleSubmitQuiz = () => {
    const correct = mistake.questions.filter(q => answers[q.id] === q.correctIndex).length;
    setQuizScore(correct);
    setSubmitted(true);
    completeMistakeCoaching(mistakeId, correct, mistake.questions.length);
    const passed = correct / mistake.questions.length >= 0.8;
    const msg = passed
      ? "Excellent work. Coaching session complete."
      : "Good effort. Review the material and try again.";
    setNovaMessage(msg);
    speak(msg);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setQuizScore(0);
    setPhase("lesson");
  };

  const mp = mistakeProgress[mistakeId];
  const isPreviouslyPassed = mp?.passed ?? false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sticky Header */}
      <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
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
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase border capitalize ${RISK_COLORS[mistake.riskLevel]}`}>
              {mistake.riskLevel} risk
            </span>
            <button
              onClick={() => toggleMute()}
              className="p-2 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition"
              title={muted ? "Unmute NOVA" : "Mute NOVA"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        <NovaLessonGuide message={novaMessage || mistake.novaIntro} isSpeaking={isSpeaking} />

        {/* ── WELCOME PHASE ── */}
        {phase === "welcome" && (
          <div className="space-y-6">
            {/* Hero header */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8 shadow-2xl">
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`rounded-full px-3 py-1 text-xs font-bold border capitalize ${RISK_COLORS[mistake.riskLevel]}`}>
                  {mistake.riskLevel} risk
                </span>
                <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-300">
                  {mistake.category}
                </span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                  NOVA Coaching
                </span>
                {isPreviouslyPassed && (
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Previously Passed
                  </span>
                )}
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight">{mistake.title}</h1>
              <p className="mt-3 text-xl text-slate-300">{mistake.heroLine}</p>
              <div className="mt-6 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide text-yellow-300 font-bold">NOVA Coaching Line</p>
                <p className="mt-2 text-lg text-yellow-100 font-semibold">{mistake.novaLine}</p>
              </div>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Fix Steps</p>
                <p className="mt-1 text-2xl font-black text-white">{mistake.fixSteps.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Questions</p>
                <p className="mt-1 text-2xl font-black text-white">{mistake.questions.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider">To Pass</p>
                <p className="mt-1 text-2xl font-black text-white">80%</p>
              </div>
            </div>

            <button
              onClick={handleReady}
              className="w-full py-5 rounded-2xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20 active:scale-[0.98]"
            >
              Start Coaching Session
            </button>
          </div>
        )}

        {/* ── LESSON PHASE ── */}
        {phase === "lesson" && (
          <div className="space-y-8">
            {/* NOVA Coaching Line callout */}
            <div className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-300 mb-2">NOVA Coaching Line</p>
              <p className="text-lg font-semibold text-yellow-100">{mistake.novaLine}</p>
            </div>

            {/* Coaching Breakdown */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-xl">
              <h2 className="text-2xl font-black mb-5">Coaching Breakdown</h2>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6">
                <p className="text-slate-200 leading-8 whitespace-pre-line">{mistake.coachingScript}</p>
              </div>
              <button
                onClick={() => {
                  stopSpeaking();
                  setNovaMessage(mistake.coachingScript);
                  speak(mistake.coachingScript);
                }}
                className="mt-4 flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 font-semibold transition"
              >
                <Volume2 className="h-4 w-4" /> Replay NOVA
              </button>
            </div>

            {/* Real Shift Scenario */}
            <div className="rounded-3xl bg-gradient-to-r from-red-500/10 to-yellow-500/10 border border-yellow-400/30 p-8">
              <h2 className="text-2xl font-black text-yellow-200 mb-3">Real Shift Scenario</h2>
              <div className="text-slate-300 space-y-1">
                <p className="font-semibold">{mistake.scenario.assignment}</p>
                <p>{mistake.scenario.location}</p>
                <p className="text-red-300 font-semibold mt-2">Issue: {mistake.scenario.issue}</p>
              </div>
              <div className="mt-6 grid md:grid-cols-2 gap-5">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                  <p className="text-red-300 font-bold mb-3">Wrong Flow</p>
                  <ul className="space-y-2">
                    {mistake.scenario.wrongFlow.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start text-slate-300 text-sm">
                        <span className="text-red-400 mt-0.5 shrink-0">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
                  <p className="text-green-300 font-bold mb-3">Correct Flow</p>
                  <ul className="space-y-2">
                    {mistake.scenario.correctFlow.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start text-slate-300 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Why / What grid */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-7">
                <h3 className="text-lg font-black mb-3">Why It Happens</h3>
                <p className="text-slate-300 leading-7">{mistake.whyItHappens}</p>
              </div>
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-7">
                <h3 className="text-lg font-black mb-3">What Goes Wrong</h3>
                <p className="text-slate-300 leading-7">{mistake.whatGoesWrong}</p>
              </div>
            </div>

            {/* Fix Steps */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
              <h2 className="text-2xl font-black mb-6">{mistake.fixSteps.length} Fix Steps</h2>
              <div className="space-y-4">
                {mistake.fixSteps.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <div className="h-9 w-9 rounded-full bg-yellow-400 text-slate-950 font-black flex items-center justify-center shrink-0 text-sm">
                      {i + 1}
                    </div>
                    <p className="text-slate-200 leading-7">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Test CTA */}
            <div className="rounded-3xl border border-yellow-400/40 bg-yellow-500/10 p-8">
              <h2 className="text-xl font-black text-yellow-200 mb-2">Coaching Complete</h2>
              <p className="text-slate-300 mb-6">
                You have reviewed all the content. Take the quick quiz to complete this coaching session.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleStartTest}
                  className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition active:scale-[0.98]"
                >
                  Take the Test <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    stopSpeaking();
                    setNovaMessage(mistake.coachingScript);
                    speak(mistake.coachingScript);
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3 font-semibold text-white hover:border-yellow-400 hover:text-yellow-400 transition"
                >
                  <Volume2 className="h-4 w-4" /> Replay NOVA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TEST PHASE ── */}
        {phase === "test" && (
          <div className="space-y-6">
            {!submitted ? (
              <>
                <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-5 text-center">
                  <p className="text-yellow-300 font-black text-lg mb-1">Lesson Complete — Take the Quiz</p>
                  <p className="text-slate-400 text-sm">
                    Answer each question. You need {Math.ceil(mistake.questions.length * 0.8)} out of{" "}
                    {mistake.questions.length} correct to pass.
                  </p>
                </div>

                {mistake.questions.map((q, qi) => (
                  <div key={q.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="font-bold text-white mb-4">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-3">
                      {q.options.map((opt, oi) => {
                        const selected = answers[q.id] === oi;
                        return (
                          <button
                            key={oi}
                            onClick={() => handleSelectAnswer(q.id, oi)}
                            className={`w-full text-left rounded-2xl border px-5 py-3.5 text-sm font-medium transition-all ${
                              selected
                                ? "border-yellow-400 bg-yellow-400/10 text-yellow-200"
                                : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            <span className="font-bold mr-2 text-slate-500">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmitQuiz}
                  disabled={!allAnswered}
                  className="w-full py-4 rounded-2xl bg-yellow-400 text-slate-950 font-black text-lg hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  Submit Test
                </button>
              </>
            ) : (
              <div className="space-y-6">
                {/* Result card */}
                {quizScore / mistake.questions.length >= 0.8 ? (
                  <div className="rounded-3xl border border-green-500/40 bg-green-500/10 p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-black text-green-300 mb-2">Coaching Passed</h2>
                    <p className="text-slate-300 mb-1">
                      Score: {quizScore} / {mistake.questions.length}
                    </p>
                    <p className="text-slate-400 text-sm">This mistake has been marked as coached.</p>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-8 text-center">
                    <h2 className="text-3xl font-black text-red-300 mb-2">Not Quite</h2>
                    <p className="text-slate-300 mb-1">
                      Score: {quizScore} / {mistake.questions.length}
                    </p>
                    <p className="text-slate-400 text-sm">Review the coaching content and try again.</p>
                  </div>
                )}

                {/* Review answers */}
                <div className="space-y-4">
                  {mistake.questions.map((q, qi) => {
                    const selected = answers[q.id] ?? -1;
                    const correct = selected === q.correctIndex;
                    return (
                      <div
                        key={q.id}
                        className={`rounded-2xl border p-5 ${
                          correct ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                              correct ? "bg-green-500 text-white" : "bg-red-500 text-white"
                            }`}
                          >
                            {correct ? "✓" : "✗"}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-white text-sm mb-2">
                              {qi + 1}. {q.question}
                            </p>
                            {!correct && (
                              <p className="text-green-300 text-sm font-semibold">
                                Correct: {q.options[q.correctIndex]}
                              </p>
                            )}
                            {!correct && (
                              <p className="text-red-400 text-sm mt-1">
                                Your answer: {selected >= 0 ? q.options[selected] : "—"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer actions */}
                <div className="flex flex-wrap gap-3">
                  {quizScore / mistake.questions.length < 0.8 && (
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
                    >
                      <RotateCcw className="h-4 w-4" /> Review & Retry
                    </button>
                  )}
                  <Link
                    href="/mistakes"
                    className="flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3 font-semibold text-white hover:border-yellow-400 hover:text-yellow-400 transition"
                  >
                    <ArrowLeft className="h-4 w-4" /> All Mistakes
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
