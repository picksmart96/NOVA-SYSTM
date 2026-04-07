interface LessonStepCardProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  content: string;
  isActive: boolean;
}

export function LessonStepCard({
  stepNumber,
  totalSteps,
  title,
  content,
  isActive,
}: LessonStepCardProps) {
  return (
    <div
      className={`rounded-2xl border p-6 transition-all duration-300 ${
        isActive
          ? "border-yellow-400/50 bg-yellow-400/5 shadow-lg shadow-yellow-400/5"
          : "border-slate-800 bg-slate-900 opacity-60"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
            isActive
              ? "bg-yellow-400 text-slate-950"
              : "bg-slate-800 text-slate-500"
          }`}
        >
          {stepNumber}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Step {stepNumber} of {totalSteps}
          </p>
          <h3 className="font-black text-white text-lg leading-tight">{title}</h3>
        </div>
      </div>
      <p className="text-slate-300 leading-relaxed pl-11">{content}</p>
    </div>
  );
}
