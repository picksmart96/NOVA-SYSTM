import { useState } from "react";
import { YesNoQuestion } from "./YesNoQuestion";
import { LessonResultCard } from "./LessonResultCard";
import type { LessonQuestion } from "@/data/lessonContent";

interface LessonTestProps {
  moduleId: string;
  questions: LessonQuestion[];
  onComplete: (score: number, total: number) => void;
}

type AnswerMap = Record<string, "yes" | "no">;

export function LessonTest({ moduleId, questions, onComplete }: LessonTestProps) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  const handleSubmit = () => {
    const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length;
    setScore(correct);
    setSubmitted(true);
    onComplete(correct, questions.length);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (submitted) {
    return (
      <LessonResultCard
        moduleId={moduleId}
        score={score}
        total={questions.length}
        passed={score / questions.length >= 0.8}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-5 text-center mb-6">
        <p className="text-yellow-300 font-black text-lg mb-1">Lesson Complete. Start Test.</p>
        <p className="text-slate-400 text-sm">Answer each question. You need 80% to pass.</p>
      </div>

      {questions.map((q, i) => (
        <YesNoQuestion
          key={q.id}
          questionNumber={i + 1}
          question={q.question}
          answer={answers[q.id] ?? null}
          onAnswer={ans => setAnswers(prev => ({ ...prev, [q.id]: ans }))}
        />
      ))}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full py-4 rounded-2xl bg-yellow-400 text-slate-950 font-black text-lg hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed mt-4"
      >
        Submit Test
      </button>
    </div>
  );
}
