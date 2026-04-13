import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { realShiftSimulationLessonPage as lesson } from "@/data/realShiftSimulationLessonPage";
import { useProgressStore } from "@/lib/progressStore";
import { NovaLessonGuide } from "@/components/training/NovaLessonGuide";
import { LessonVideoPlayer } from "@/components/training/LessonVideoPlayer";
import { useBilingualSpeech } from "@/hooks/useBilingualSpeech";
import {
  ArrowLeft, Volume2, VolumeX, CheckCircle2, XCircle, ChevronLeft,
  ChevronRight, Clock, BookOpen, Headphones, Award, ShieldCheck,
} from "lucide-react";


type Phase = "intro" | "lesson" | "quiz";

export default function RealShiftSimulationLessonPage() {
  const { startLesson, completeLesson } = useProgressStore();

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentSection, setCurrentSection] = useState(0);
  const [novaMessage, setNovaMessage] = useState(lesson.introCard.novaIntroVoice);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scoreRecorded, setScoreRecorded] = useState(false);

  const { isSpeaking, muted, toggleMute, speak, stopSpeaking } = useBilingualSpeech();

  useEffect(() => {
    startLesson("mod-6");
    speak(lesson.introCard.novaIntroVoice);
    return () => stopSpeaking();
  }, []);

  const score = useMemo(() => {
    const correct = lesson.quiz.questions.filter(
      (q) => answers[q.id] === q.correctIndex
    ).length;
    return Math.round((correct / lesson.quiz.questions.length) * 100);
  }, [answers]);

  const passed = score >= lesson.quiz.passingScore;

  useEffect(() => {
    if (submitted && !scoreRecorded) {
      setScoreRecorded(true);
      completeLesson("mod-6", score, lesson.quiz.questions.length);
      const msg = lesson.completion.novaVoice;
      setNovaMessage(msg);
      speak(msg);
    }
  }, [submitted]);

  const totalSections = lesson.sections.length;
  const sectionData = lesson.sections[currentSection] ?? lesson.sections[0];
  const isLastSection = currentSection === totalSections - 1;

  const progressPercent =
    phase === "intro"
      ? 0
      : phase === "quiz"
      ? 100
      : Math.round(10 + ((currentSection + 1) / totalSections) * 80);

  const question = lesson.quiz.questions[currentQ];

  function speakSection(idx: number) {
    const s = lesson.sections[idx];
    setNovaMessage(s.novaVoiceScript);
    speak(s.novaVoiceScript);
  }

  function handleStartLesson() {
    stopSpeaking();
    setCurrentSection(0);
    setPhase("lesson");
    speakSection(0);
  }

  function handleNextSection() {
    stopSpeaking();
    if (!isLastSection) {
      const next = currentSection + 1;
      setCurrentSection(next);
      speakSection(next);
    } else {
      setPhase("quiz");
      const msg = "Lesson complete. Time for the test. Pass eighty percent or higher to finish.";
      setNovaMessage(msg);
      speak(msg);
    }
  }

  function handlePrevSection() {
    if (currentSection > 0) {
      stopSpeaking();
      const prev = currentSection - 1;
      setCurrentSection(prev);
      speakSection(prev);
    }
  }

  function handleReplaySection() {
    stopSpeaking();
    speakSection(currentSection);
  }

  function handleAnswer(qId: string, idx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  function handleSubmit() {
    if (Object.keys(answers).length < lesson.quiz.questions.length) return;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-4">
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
              Simulation
            </p>
            <p className="font-black text-white text-sm truncate">{lesson.title}</p>
          </div>

          <button
            onClick={toggleMute}
            title={muted ? "Unmute NOVA" : "Mute NOVA"}
            className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
            {lesson.level}
          </span>
        </div>

        <div className="max-w-3xl mx-auto mt-3">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>
              {phase === "intro" ? "Ready to start" : phase === "quiz" ? "Lesson Test" : "Reading"}
            </span>
            <span>{progressPercent}%</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">

        <NovaLessonGuide message={novaMessage} isSpeaking={isSpeaking} />

        {phase === "intro" && (
          <>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-bold text-purple-400">
                  <ShieldCheck className="h-3 w-3" /> {lesson.level}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                  <Clock className="h-3 w-3" /> {lesson.duration}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                  <BookOpen className="h-3 w-3" /> {lesson.steps} sections
                </span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                  <Headphones className="h-3 w-3" /> NOVA voice
                </span>
              </div>
              <h1 className="text-4xl font-black text-white">{lesson.hero.heading}</h1>
              <p className="mt-4 text-lg text-slate-300 leading-relaxed">
                {lesson.hero.subheading}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">{lesson.introCard.title}</p>
              <p className="text-slate-200 leading-relaxed">{lesson.introCard.text}</p>
            </div>

            <button
              onClick={handleStartLesson}
              className="w-full py-5 rounded-2xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20 active:scale-[0.98]"
            >
              Ready — Start Lesson
            </button>
          </>
        )}

        {phase === "lesson" && (
          <>
            <div className="flex items-center gap-2">
              {lesson.sections.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i === currentSection
                      ? "flex-1 bg-yellow-400"
                      : i < currentSection
                      ? "w-5 bg-green-500"
                      : "w-5 bg-slate-700"
                  }`}
                />
              ))}
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap ml-1">
                {currentSection + 1} / {totalSections}
              </span>
            </div>

            <div className="rounded-3xl border border-yellow-400/30 bg-slate-900 p-8 shadow-lg shadow-yellow-400/5 transition-all duration-300 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{sectionData.title}</h2>
                <p className="mt-2 text-yellow-400 font-bold italic text-lg">"{sectionData.novaLine}"</p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Why It Matters</p>
                <p className="text-slate-200 leading-relaxed">{sectionData.whyItMatters}</p>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">What Goes Wrong</p>
                <p className="text-slate-300 leading-relaxed">{sectionData.badExample}</p>
                <ul className="mt-3 space-y-1.5">
                  {sectionData.whatHappens.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400 text-sm">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2">How to Do It Right</p>
                <ul className="space-y-2">
                  {sectionData.howToPrevent.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 px-5 py-4">
                <p className="font-black text-yellow-300 text-base">{sectionData.coachingClose}</p>
              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-slate-950 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">NOVA Is Reading This Section</p>
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-yellow-400 animate-pulse" : "bg-slate-600"}`} />
                </div>
                <p className="text-slate-400 text-sm">Hit "Replay NOVA" below to hear this section again at any time.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {currentSection > 0 && (
                <button
                  onClick={handlePrevSection}
                  className="flex items-center gap-1.5 rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 hover:border-slate-500 transition"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}

              <button
                onClick={handleReplaySection}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-400 hover:text-yellow-400 hover:border-yellow-400 transition"
              >
                <Headphones className="h-4 w-4" /> Replay NOVA
              </button>

              <button
                onClick={handleNextSection}
                className="ml-auto flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition-all active:scale-[0.98]"
              >
                {isLastSection ? "Continue to Test" : "Next Section"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {phase === "quiz" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 space-y-8">
            <div>
              <h2 className="text-3xl font-black text-white">Lesson Test</h2>
              <p className="mt-2 text-slate-400">
                Pass <span className="text-yellow-400 font-bold">{lesson.quiz.passingScore}%</span> or higher to complete this lesson.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-6">
              <div className="flex items-center gap-2 mb-6">
                {lesson.quiz.questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQ(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === currentQ
                        ? "w-6 bg-yellow-400"
                        : answers[q.id] !== undefined
                        ? "w-2.5 bg-green-500"
                        : "w-2.5 bg-slate-700"
                    }`}
                  />
                ))}
                <span className="ml-auto text-xs text-slate-500 font-semibold">
                  {currentQ + 1} / {lesson.quiz.questions.length}
                </span>
              </div>

              <p className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3">
                Question {currentQ + 1}
              </p>
              <h3 className="text-xl font-black text-white mb-6">{question.question}</h3>

              <div className="space-y-3">
                {question.options.map((option, idx) => {
                  const selected = answers[question.id] === idx;
                  const isCorrect = submitted && question.correctIndex === idx;
                  const isWrong = submitted && selected && question.correctIndex !== idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(question.id, idx)}
                      disabled={submitted}
                      className={`w-full rounded-2xl border px-5 py-4 text-left font-semibold transition-all ${
                        isCorrect
                          ? "border-green-500 bg-green-500/10 text-green-200"
                          : isWrong
                          ? "border-red-500 bg-red-500/10 text-red-200"
                          : selected
                          ? "border-yellow-400 bg-yellow-400/10 text-yellow-200"
                          : "border-slate-700 bg-slate-900 text-slate-200 hover:border-yellow-400/50 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{option}</span>
                        {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />}
                        {isWrong && <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentQ((p) => Math.max(p - 1, 0))}
                  disabled={currentQ === 0}
                  className="flex items-center gap-1.5 rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 hover:border-slate-500 transition disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                {currentQ < lesson.quiz.questions.length - 1 && (
                  <button
                    onClick={() => setCurrentQ((p) => p + 1)}
                    className="flex items-center gap-1.5 rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 hover:border-slate-500 transition"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                )}

                {!submitted && (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length < lesson.quiz.questions.length}
                    className="ml-auto rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Test
                  </button>
                )}
              </div>
            </div>

            {submitted && (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-6 space-y-5">
                <div className="flex items-center gap-5">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center shrink-0 border-4 ${
                      passed
                        ? "border-green-500 bg-green-500/10"
                        : "border-red-500 bg-red-500/10"
                    }`}
                  >
                    <span className={`text-2xl font-black ${passed ? "text-green-300" : "text-red-300"}`}>
                      {score}%
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {passed
                        ? <Award className="h-5 w-5 text-yellow-400" />
                        : <XCircle className="h-5 w-5 text-red-400" />}
                      <h3 className="text-2xl font-black text-white">
                        {passed ? "Passed!" : "Needs Review"}
                      </h3>
                    </div>
                    <p className="text-slate-400 text-sm">
                      {lesson.quiz.questions.filter((q) => answers[q.id] === q.correctIndex).length}
                      {" "}of {lesson.quiz.questions.length} correct
                      {" "}· Passing score: {lesson.quiz.passingScore}%
                    </p>
                  </div>
                </div>

                <p className="text-slate-300">{lesson.completion.message}</p>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
                    NOVA Completion Voice
                  </p>
                  <p className="text-slate-200 italic">"{lesson.completion.novaVoice}"</p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {!passed && (
                    <button
                      onClick={() => {
                        stopSpeaking();
                        setAnswers({});
                        setSubmitted(false);
                        setScoreRecorded(false);
                        setCurrentQ(0);
                        setPhase("lesson");
                        const msg = "Let's review the lesson again before retrying.";
                        setNovaMessage(msg);
                        speak(msg);
                      }}
                      className="rounded-2xl border border-slate-700 px-6 py-3 font-bold text-slate-300 hover:border-yellow-400 hover:text-yellow-400 transition"
                    >
                      Review Lesson
                    </button>
                  )}
                  {!passed && (
                    <button
                      onClick={() => {
                        setAnswers({});
                        setSubmitted(false);
                        setScoreRecorded(false);
                        setCurrentQ(0);
                      }}
                      className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition"
                    >
                      Retry Test
                    </button>
                  )}
                  {passed && (
                    <Link href="/training">
                      <button className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition">
                        Back to Training
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Demo Video ── */}
      <div className="max-w-3xl mx-auto px-4 pb-14 pt-6">
        <LessonVideoPlayer moduleId="mod-6" />
      </div>
    </div>
  );
}
