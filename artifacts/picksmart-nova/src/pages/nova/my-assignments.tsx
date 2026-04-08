import { Link, useLocation } from "wouter";
import { useTrainerStore } from "@/lib/trainerStore";
import { useAuthStore } from "@/lib/authStore";
import { ASSIGNMENTS } from "@/data/assignments";
import { ClipboardList, Headphones, Clock, Package, DoorOpen, ChevronRight, CheckCircle2, Circle, Activity } from "lucide-react";

export default function MyAssignmentsPage() {
  const [, navigate] = useLocation();
  const { currentUser } = useAuthStore();
  const { selectors, assignments: trainerAssignments } = useTrainerStore();

  const selectorProfile = selectors.find(
    (s) =>
      s.email.toLowerCase() === (currentUser?.username ?? "").toLowerCase() ||
      s.name.toLowerCase().includes(
        (currentUser?.fullName ?? "").toLowerCase().split(" ")[0]
      )
  );

  // Combine static + trainer-created assignments for this selector
  const myAssignments = [
    ...ASSIGNMENTS.filter((a) => a.selectorUserId === (selectorProfile?.userId ?? currentUser?.username ?? "")),
    ...trainerAssignments.filter(
      (a) =>
        a.selectorUserId === (selectorProfile?.userId ?? currentUser?.username ?? "")
    ),
  ];

  const statusColor = (s: string) => {
    if (s === "active") return "bg-green-500/20 text-green-300 border-green-500/30";
    if (s === "completed") return "bg-slate-700 text-slate-400 border-slate-600";
    return "bg-yellow-400/10 text-yellow-300 border-yellow-400/20";
  };
  const statusLabel = (s: string) => {
    if (s === "active") return "Active";
    if (s === "completed") return "Completed";
    return "Pending";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">My Assignments</h1>
            {selectorProfile && (
              <p className="text-slate-400 text-sm">{selectorProfile.novaId} · {selectorProfile.level}</p>
            )}
          </div>
        </div>

        {/* NOVA Trainer shortcut */}
        <Link href="/nova-trainer">
          <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/5 p-5 flex items-center justify-between cursor-pointer hover:bg-yellow-400/10 transition group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-black text-yellow-300">NOVA Trainer</p>
                <p className="text-slate-400 text-sm">Start a voice-directed picking session</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Assignment list */}
        {myAssignments.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 flex flex-col items-center gap-4 text-center">
            <Activity className="h-10 w-10 text-slate-600" />
            <p className="text-slate-400 text-sm">
              No assignments yet. Your trainer will assign one to you.
            </p>
            <Link href="/selector">
              <button className="rounded-2xl border border-slate-700 px-5 py-2 text-sm text-slate-300 hover:border-slate-500 transition">
                Back to Portal
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myAssignments.map((a) => (
              <div
                key={a.id}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-600 transition cursor-pointer group"
                onClick={() => navigate(`/nova/assignments/${a.id}`)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {a.status === "completed"
                      ? <CheckCircle2 className="h-5 w-5 text-slate-500 shrink-0" />
                      : <Circle className="h-5 w-5 text-yellow-400 shrink-0" />
                    }
                    <div>
                      <p className="font-black text-white">Assignment #{a.assignmentNumber ?? a.id.slice(-6)}</p>
                      <p className="text-slate-500 text-xs">{(a as { type?: string }).type ?? "TRAINING"}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs px-3 py-1 rounded-full border font-bold ${statusColor(a.status ?? "pending")}`}>
                    {statusLabel(a.status ?? "pending")}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <Stat icon={<Package className="h-3.5 w-3.5" />} label="Cases" value={(a as { totalCases?: number }).totalCases ?? "—"} />
                  <Stat icon={<Clock className="h-3.5 w-3.5" />} label="Goal" value={`${(a as { goalTimeMinutes?: number }).goalTimeMinutes ?? "—"}m`} />
                  <Stat icon={<Activity className="h-3.5 w-3.5" />} label="Aisles" value={`${(a as { startAisle?: number }).startAisle ?? "?"}–${(a as { endAisle?: number }).endAisle ?? "?"}`} />
                  <Stat icon={<DoorOpen className="h-3.5 w-3.5" />} label="Door" value={(a as { doorNumber?: number }).doorNumber ?? "—"} />
                </div>

                {a.status !== "completed" && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/nova/voice/${a.id}`); }}
                      className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-yellow-300 transition"
                    >
                      <Headphones className="h-3.5 w-3.5" />
                      Start Voice Session
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/nova/assignments/${a.id}`); }}
                      className="flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 transition"
                    >
                      View Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-slate-600 text-xs pt-2">
          PickSmart Academy — NOVA Assignment Board
        </p>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}
