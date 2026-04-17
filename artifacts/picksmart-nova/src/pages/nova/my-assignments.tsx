import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import {
  ClipboardList, Headphones, Clock, Package, DoorOpen,
  ChevronRight, CheckCircle2, Circle, Activity, Zap, RefreshCw,
  Users, Shield
} from "lucide-react";

interface DbAssignment {
  id: string;
  assignmentNumber: number;
  title: string;
  status: string;
  totalCases: number;
  goalTimeMinutes: number | null;
  startAisle: number;
  endAisle: number;
  doorNumber: number;
  voiceMode: string;
  printerNumber: number;
  alphaLabelNumber: number;
  bravoLabelNumber: number;
  trainerUserId: string | null;
  selectorUserId: string | null;
  percentComplete: number;
}

export default function MyAssignmentsPage() {
  const [, navigate] = useLocation();
  const { currentUser, jwtToken } = useAuthStore();

  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const isTrainer = ["trainer", "supervisor", "admin", "owner"].includes(currentUser?.role ?? "");

  const fetchAssignments = async () => {
    if (!jwtToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assignments/mine", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      const data: DbAssignment[] = await res.json();
      setAssignments(data);
    } catch {
      setError("Could not load assignments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, [jwtToken]); // eslint-disable-line

  const statusColor = (s: string) => {
    if (s === "active")    return "bg-green-500/20 text-green-300 border-green-500/30";
    if (s === "completed") return "bg-slate-700 text-slate-400 border-slate-600";
    return "bg-yellow-400/10 text-yellow-300 border-yellow-400/20";
  };
  const statusLabel = (s: string) => {
    if (s === "active")    return "Active";
    if (s === "completed") return "Completed";
    if (s === "archived")  return "Archived";
    return "Pending";
  };

  // Split: picks assigned to ME vs picks I created for trainees
  const myPicks    = assignments.filter(a => a.selectorUserId === currentUser?.id);
  const iCreated   = assignments.filter(a => a.trainerUserId === currentUser?.id && a.selectorUserId !== currentUser?.id);

  // Quick-load: first active/pending pick assigned TO me
  const activePick = myPicks.find(a => a.status === "active" || a.status === "pending");

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Assignments</h1>
              <p className="text-slate-400 text-xs">{currentUser?.fullName} · {currentUser?.role}</p>
            </div>
          </div>
          <button
            onClick={fetchAssignments}
            className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center hover:border-slate-500 transition"
          >
            <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-300 mb-4">{error}</p>
            <button onClick={fetchAssignments} className="px-5 py-2 rounded-2xl border border-red-500/40 text-red-300 text-sm hover:bg-red-500/10 transition">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* ── MY PICKS (assigned to me as a trainee) ── */}
            {myPicks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Headphones className="h-4 w-4 text-yellow-400" />
                  <p className="text-xs font-black uppercase tracking-widest text-yellow-400">My Picks</p>
                </div>

                {/* Quick Load Pick */}
                {activePick && (
                  <div
                    onClick={() => navigate(`/nova/voice/${activePick.id}`)}
                    className="rounded-3xl border border-yellow-400 bg-yellow-400/10 p-6 flex items-center justify-between cursor-pointer hover:bg-yellow-400/15 transition group shadow-[0_0_30px_rgba(250,204,21,0.1)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/30">
                        <Zap className="h-6 w-6 text-slate-950" />
                      </div>
                      <div>
                        <p className="font-black text-yellow-300 text-lg">Load Pick</p>
                        <p className="text-slate-400 text-sm">{activePick.title}</p>
                        <p className="text-slate-500 text-xs">
                          {activePick.totalCases} cases · Aisles {activePick.startAisle}–{activePick.endAisle} · Door {activePick.doorNumber}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-yellow-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                )}

                {myPicks.map(a => (
                  <AssignmentCard key={a.id} a={a} navigate={navigate} statusColor={statusColor} statusLabel={statusLabel} isTrainerView={false} />
                ))}
              </div>
            )}

            {/* ── ASSIGNMENTS I CREATED (trainer view) ── */}
            {iCreated.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <p className="text-xs font-black uppercase tracking-widest text-blue-400">Assignments You Created</p>
                </div>

                {iCreated.map(a => (
                  <AssignmentCard key={a.id} a={a} navigate={navigate} statusColor={statusColor} statusLabel={statusLabel} isTrainerView={true} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {myPicks.length === 0 && iCreated.length === 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 flex flex-col items-center gap-4 text-center">
                <Activity className="h-10 w-10 text-slate-600" />
                <div>
                  <p className="text-white font-bold mb-1">No Assignments Yet</p>
                  <p className="text-slate-400 text-sm">
                    {isTrainer
                      ? "Create assignments in Assignment Control and they'll appear here."
                      : "Your trainer will assign a picking assignment to you. Check back soon."}
                  </p>
                </div>
                {isTrainer ? (
                  <Link href="/nova/control">
                    <button className="rounded-2xl bg-yellow-400 text-slate-950 px-5 py-2 text-sm font-black hover:bg-yellow-300 transition">
                      Go to Assignment Control
                    </button>
                  </Link>
                ) : (
                  <Link href="/selector">
                    <button className="rounded-2xl border border-slate-700 px-5 py-2 text-sm text-slate-300 hover:border-slate-500 transition">
                      Back to Portal
                    </button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* Quick links */}
        <div className="space-y-2">
          {isTrainer && (
            <Link href="/nova/control">
              <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4 flex items-center justify-between cursor-pointer hover:border-slate-600 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                    <Users className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">Assignment Control</p>
                    <p className="text-slate-500 text-xs">Create & assign picks to trainees</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}
          <Link href="/training-reports">
            <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4 flex items-center justify-between cursor-pointer hover:border-slate-600 transition group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">Training Reports</p>
                  <p className="text-slate-500 text-xs">NOVA AI feedback from past sessions</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        <p className="text-center text-slate-600 text-xs pt-2">PickSmart Academy — NOVA Assignment Board</p>
      </div>
    </div>
  );
}

// ── Assignment card ─────────────────────────────────────────────────────────

function AssignmentCard({
  a, navigate, statusColor, statusLabel, isTrainerView
}: {
  a: DbAssignment;
  navigate: (path: string) => void;
  statusColor: (s: string) => string;
  statusLabel: (s: string) => string;
  isTrainerView: boolean;
}) {
  return (
    <div
      className="rounded-3xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition cursor-pointer group"
      onClick={() => navigate(`/nova/assignments/${a.id}`)}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {a.status === "completed"
            ? <CheckCircle2 className="h-5 w-5 text-slate-500 shrink-0" />
            : <Circle className="h-5 w-5 text-yellow-400 shrink-0" />
          }
          <div>
            <p className="font-black text-white">{a.title || `Assignment #${a.assignmentNumber}`}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider">{a.voiceMode.replace("_", " ")} MODE</p>
          </div>
        </div>
        <span className={`shrink-0 text-xs px-3 py-1 rounded-full border font-bold ${statusColor(a.status)}`}>
          {statusLabel(a.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Stat icon={<Package className="h-3.5 w-3.5" />} label="Cases" value={a.totalCases} />
        <Stat icon={<Clock className="h-3.5 w-3.5" />} label="Goal" value={`${a.goalTimeMinutes ?? "—"}m`} />
        <Stat icon={<Activity className="h-3.5 w-3.5" />} label="Aisles" value={`${a.startAisle}–${a.endAisle}`} />
        <Stat icon={<DoorOpen className="h-3.5 w-3.5" />} label="Door" value={a.doorNumber} />
      </div>

      {/* Progress bar for active */}
      {a.status === "active" && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(a.percentComplete ?? 0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${a.percentComplete ?? 0}%` }} />
          </div>
        </div>
      )}

      {a.status !== "completed" && a.status !== "archived" && (
        <div className="flex gap-2">
          {!isTrainerView && (
            <button
              onClick={e => { e.stopPropagation(); navigate(`/nova/voice/${a.id}`); }}
              className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-yellow-300 transition"
            >
              <Headphones className="h-3.5 w-3.5" /> Load Pick
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); navigate(`/nova/assignments/${a.id}`); }}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 transition"
          >
            Details <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}
