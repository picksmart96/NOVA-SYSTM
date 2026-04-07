type Answer = "yes" | "no" | null;

interface YesNoQuestionProps {
  questionNumber: number;
  question: string;
  answer: Answer;
  onAnswer: (answer: "yes" | "no") => void;
  revealed?: boolean;
  correctAnswer?: "yes" | "no";
}

export function YesNoQuestion({
  questionNumber,
  question,
  answer,
  onAnswer,
  revealed = false,
  correctAnswer,
}: YesNoQuestionProps) {
  const isCorrect = revealed && answer === correctAnswer;
  const isWrong = revealed && answer !== null && answer !== correctAnswer;

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        isCorrect
          ? "border-green-500/50 bg-green-500/5"
          : isWrong
          ? "border-red-500/50 bg-red-500/5"
          : "border-slate-800 bg-slate-900"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
        Question {questionNumber}
      </p>
      <p className="text-white font-semibold text-base leading-snug mb-4">{question}</p>

      <div className="flex gap-3">
        <button
          onClick={() => !revealed && onAnswer("yes")}
          disabled={revealed}
          className={`flex-1 py-3 rounded-xl font-black text-base transition-all disabled:cursor-default ${
            answer === "yes"
              ? revealed
                ? isCorrect
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                : "bg-yellow-400 text-slate-950"
              : revealed
              ? "bg-slate-800 text-slate-600"
              : "bg-slate-800 text-white border border-slate-700 hover:border-yellow-400 hover:text-yellow-400"
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => !revealed && onAnswer("no")}
          disabled={revealed}
          className={`flex-1 py-3 rounded-xl font-black text-base transition-all disabled:cursor-default ${
            answer === "no"
              ? revealed
                ? isCorrect
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                : "bg-yellow-400 text-slate-950"
              : revealed
              ? "bg-slate-800 text-slate-600"
              : "bg-slate-800 text-white border border-slate-700 hover:border-yellow-400 hover:text-yellow-400"
          }`}
        >
          No
        </button>
      </div>

      {revealed && correctAnswer && (
        <p
          className={`text-xs font-bold mt-3 ${
            isCorrect ? "text-green-400" : "text-red-400"
          }`}
        >
          {isCorrect ? "✓ Correct" : `✗ Correct answer: ${correctAnswer.toUpperCase()}`}
        </p>
      )}
    </div>
  );
}
