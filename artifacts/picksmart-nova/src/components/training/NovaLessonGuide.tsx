import { Headphones } from "lucide-react";

interface NovaLessonGuideProps {
  message: string;
  isSpeaking: boolean;
}

export function NovaLessonGuide({ message, isSpeaking }: NovaLessonGuideProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col items-center text-center">
      {/* Orb */}
      <div className="relative flex items-center justify-center h-24 w-24 mb-5">
        {isSpeaking && (
          <>
            <div
              className="absolute inset-0 rounded-full bg-yellow-400/25 animate-ping"
              style={{ animationDuration: "1.4s" }}
            />
            <div
              className="absolute inset-[-10px] rounded-full bg-yellow-400/10 animate-ping"
              style={{ animationDuration: "2s", animationDelay: "0.3s" }}
            />
          </>
        )}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            isSpeaking
              ? "bg-yellow-400 scale-105 shadow-yellow-400/30"
              : "bg-slate-800 border-2 border-slate-700"
          }`}
        >
          <Headphones
            className={`h-9 w-9 ${isSpeaking ? "text-slate-950" : "text-slate-500"}`}
          />
        </div>
      </div>

      {/* NOVA label */}
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">NOVA</p>

      {/* Message */}
      <p
        className={`text-lg md:text-xl font-medium leading-relaxed transition-colors ${
          isSpeaking ? "text-white" : "text-slate-400"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
