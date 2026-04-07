import type { TrainingSession } from "@/lib/trainerStore";

interface SessionCardProps {
  session: TrainingSession;
}

const SESSION_TYPE_COLORS: Record<string, string> = {
  Coaching: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  "NOVA Activation": "bg-green-500/10 text-green-300 border-green-500/30",
  "Assignment Review": "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  "Safety Review": "bg-red-500/10 text-red-300 border-red-500/30",
  "Performance Review": "bg-purple-500/10 text-purple-300 border-purple-500/30",
};

export function SessionCard({ session }: SessionCardProps) {
  const formattedDate = new Date(session.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const typeColor =
    SESSION_TYPE_COLORS[session.sessionType] ??
    "bg-slate-700 text-slate-300 border-slate-600";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white capitalize">{session.selectorName}</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            Logged by <span className="text-slate-300">{session.trainerName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${typeColor}`}>
            {session.sessionType}
          </span>
          <span className="text-xs text-slate-500">{formattedDate}</span>
        </div>
      </div>

      {session.notes ? (
        <p className="mt-3 text-slate-300 text-sm leading-relaxed border-t border-slate-800 pt-3">
          {session.notes}
        </p>
      ) : null}
    </div>
  );
}
