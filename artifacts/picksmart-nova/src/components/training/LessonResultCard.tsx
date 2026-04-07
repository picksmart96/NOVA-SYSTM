import { Link } from "wouter";
import { CheckCircle2, XCircle, RotateCcw, ChevronRight } from "lucide-react";
import { LESSON_CONTENT } from "@/data/lessonContent";

interface LessonResultCardProps {
  moduleId: string;
  score: number;
  total: number;
  passed: boolean;
  onRetry: () => void;
}

export function LessonResultCard({
  moduleId,
  score,
  total,
  passed,
  onRetry,
}: LessonResultCardProps) {
  const currentIndex = LESSON_CONTENT.findIndex(l => l.moduleId === moduleId);
  const nextLesson = currentIndex !== -1 && currentIndex < LESSON_CONTENT.length - 1
    ? LESSON_CONTENT[currentIndex + 1]
    : null;

  const percent = Math.round((score / total) * 100);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
      {passed ? (
        <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
      ) : (
        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
      )}

      <h2 className="text-3xl font-black text-white mb-2">
        {passed ? "Lesson Passed!" : "Keep Practicing"}
      </h2>

      <p className="text-slate-400 text-lg mb-2">
        You scored <span className={`font-black ${passed ? "text-green-400" : "text-red-400"}`}>{score} / {total}</span> ({percent}%)
      </p>

      <p className="text-slate-500 text-sm mb-8">
        {passed
          ? "Great work. You have demonstrated understanding of this lesson."
          : "You need 80% or higher to pass. Review the steps and try again."}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-white font-bold hover:border-yellow-400 transition"
        >
          <RotateCcw className="h-4 w-4" /> Retry Lesson
        </button>

        {passed && nextLesson && (
          <Link
            href={`/training/lesson/${nextLesson.moduleId}`}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300 transition"
          >
            Next Lesson <ChevronRight className="h-4 w-4" />
          </Link>
        )}

        {passed && !nextLesson && (
          <Link
            href="/training"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300 transition"
          >
            Back to Academy <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
