import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTrainerStore } from "@/lib/trainerStore";
import { useAuthStore } from "@/lib/authStore";
import { AssignAssignmentModal } from "@/components/nova/AssignAssignmentModal";
import { ActivateNovaModal } from "@/components/nova/ActivateNovaModal";
import { LogSessionModal } from "@/components/nova/LogSessionModal";
import { SessionCard } from "@/components/nova/SessionCard";
import {
  Shield, Users, ClipboardList, Zap, BookOpen,
  MapPin, UserPlus, LogOut, CheckCircle2, AlertCircle, DoorOpen, KeyRound
} from "lucide-react";

type SelectorLevel = "Beginner" | "Intermediate" | "Advanced";

export default function TrainerPortalPage() {
  const [, navigate] = useLocation();
  const { currentUser, logout } = useAuthStore();
  const {
    trainer, selectors, sessions, assignments,
    addSelector, toggleNova,
  } = useTrainerStore();

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [preselectedSelectorId, setPreselectedSelectorId] = useState<number | null>(null);
  const [preselectedAssignmentId, setPreselectedAssignmentId] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "John Smith",
    age: "22",
    level: "Beginner" as SelectorLevel,
    notes: "",
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    addSelector({
      name: form.fullName,
      age: Number(form.age),
      level: form.level,
      notes: form.notes,
    });
    setForm({ fullName: "", age: "", level: "Beginner", notes: "" });
  };

  const openNovaFor = (id: number) => {
    setPreselectedSelectorId(id);
    setShowNovaModal(true);
  };
  const openAssignFor = (id: number) => {
    setPreselectedSelectorId(id);
    setPreselectedAssignmentId(null);
    setShowAssignModal(true);
  };
  const openAssignForAssignment = (assignmentId: string) => {
    setPreselectedAssignmentId(assignmentId);
    setPreselectedSelectorId(null);
    setShowAssignModal(true);
  };
  const openLogFor = (id: number) => {
    setPreselectedSelectorId(id);
    setShowLogModal(true);
  };

  const getAssignmentNumber = (assignmentId: string | null) => {
    if (!assignmentId) return null;
    return assignments.find((a) => a.id === assignmentId)?.assignmentNumber ?? null;
  };

  const openAssignmentsCount = selectors.filter((s) => s.assignedAssignmentId).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center">
                <Shield className="h-5 w-5 text-slate-950" />
              </div>
              <h1 className="text-4xl font-black">Trainer Dashboard</h1>
            </div>
            <p className="text-slate-400 capitalize">
              {trainer.name} · {trainer.role}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link href="/nova/warehouse">
              <button className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-yellow-400 transition flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Warehouse Ref
              </button>
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-red-400 hover:text-red-400 transition flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-slate-500" />
              <p className="text-slate-400 text-sm font-medium">My Selectors</p>
            </div>
            <p className="text-5xl font-black text-white">{selectors.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <p className="text-slate-400 text-sm font-medium">Sessions Logged</p>
            </div>
            <p className="text-5xl font-black text-white">{sessions.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <p className="text-slate-400 text-sm font-medium">Open Assignments</p>
            </div>
            <p className="text-5xl font-black text-white">{openAssignmentsCount}</p>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => document.getElementById("register-form")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" /> Register Selector
          </button>
          <button
            onClick={() => { setPreselectedSelectorId(null); setShowNovaModal(true); }}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-yellow-400 transition flex items-center gap-2"
          >
            <Zap className="h-4 w-4" /> Activate NOVA
          </button>
          <button
            onClick={() => { setPreselectedSelectorId(null); setShowLogModal(true); }}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-yellow-400 transition flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" /> Log Session
          </button>
          <button
            onClick={() => { setPreselectedSelectorId(null); setShowAssignModal(true); }}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:border-yellow-400 transition flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" /> Assign Assignment
          </button>
        </div>

        {/* ── Main two-column layout ── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Register Selector */}
          <div id="register-form" className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-yellow-400" /> Register Selector
            </h2>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Full name</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Age</label>
                  <input
                    value={form.age}
                    onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                    type="number"
                    min="16"
                    max="70"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm((p) => ({ ...p, level: e.target.value as SelectorLevel }))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any relevant background..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition resize-none placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" /> Register selector
              </button>
            </form>
          </div>

          {/* My Selectors */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-400" /> My Selectors
            </h2>

            {selectors.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-500">
                No selectors registered yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
                {selectors.map((selector) => {
                  const assignedNum = getAssignmentNumber(selector.assignedAssignmentId);
                  return (
                    <div
                      key={selector.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <h3 className="text-lg font-black capitalize">{selector.name}</h3>
                      <p className="mt-1 text-slate-400 text-sm">
                        {selector.novaId} · Age {selector.age}
                      </p>
                      <p className="mt-1 text-slate-400 text-sm">{selector.experience}</p>
                      {selector.novaPin && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-3 py-1">
                          <KeyRound className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs font-black text-yellow-300 tracking-widest">{selector.novaPin}</span>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                          selector.level === "Advanced"
                            ? "bg-red-500/10 text-red-300 border-red-500/30"
                            : selector.level === "Intermediate"
                            ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                            : "bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
                        }`}>
                          {selector.level}
                        </span>

                        {selector.novaActive && (
                          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300 border border-green-500/30">
                            NOVA Active
                          </span>
                        )}

                        {assignedNum && (
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
                            Assigned: #{assignedNum}
                          </span>
                        )}
                      </div>

                      {/* Quick actions */}
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                        <button
                          onClick={() => openNovaFor(selector.id)}
                          className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-yellow-400 hover:text-yellow-400 transition flex items-center gap-1"
                        >
                          <Zap className="h-3 w-3" />
                          {selector.novaActive ? "Deactivate" : "Activate"} NOVA
                        </button>
                        <button
                          onClick={() => openAssignFor(selector.id)}
                          className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-yellow-400 hover:text-yellow-400 transition flex items-center gap-1"
                        >
                          <ClipboardList className="h-3 w-3" /> Assign
                        </button>
                        <button
                          onClick={() => openLogFor(selector.id)}
                          className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-yellow-400 hover:text-yellow-400 transition flex items-center gap-1"
                        >
                          <BookOpen className="h-3 w-3" /> Log Session
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Assignments Panel ── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-yellow-400" /> Assignments
          </h2>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {assignments.map((a) => {
              const assignedTo = selectors.find((s) => s.assignedAssignmentId === a.id);
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-black text-white">#{a.assignmentNumber}</p>
                      <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        a.type === "PRODUCTION"
                          ? "bg-orange-500/10 text-orange-300 border-orange-500/30"
                          : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                      }`}>
                        {a.type}
                      </span>
                    </div>
                    {assignedTo ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Cases</span><span className="text-white font-bold">{a.totalCases}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stops</span><span className="text-white font-bold">{a.stops}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aisles</span><span className="text-white font-bold">{a.startAisle}–{a.endAisle}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" /> Door</span>
                      <span className="text-yellow-300 font-bold">{a.doorNumber} · {a.doorCode}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3">
                    {assignedTo ? (
                      <p className="text-xs text-green-300 font-semibold capitalize truncate">
                        ✓ {assignedTo.name}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600 italic">Unassigned</p>
                    )}
                  </div>

                  <div className="mt-auto flex gap-2">
                    <Link
                      href={`/nova/assignments/${a.id}`}
                      className="flex-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-center hover:border-slate-500 hover:text-white transition"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => openAssignForAssignment(a.id)}
                      className="flex-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold hover:border-yellow-400 hover:text-yellow-400 transition flex items-center justify-center gap-1"
                    >
                      <ClipboardList className="h-3 w-3" />
                      {assignedTo ? "Reassign" : "Assign"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sessions Panel ── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-yellow-400" /> Recent Sessions
          </h2>

          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-500">
              No sessions logged yet. Click <strong>Log Session</strong> to record your first.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Modals ── */}
      <AssignAssignmentModal
        open={showAssignModal}
        onClose={() => { setShowAssignModal(false); setPreselectedSelectorId(null); setPreselectedAssignmentId(null); }}
        preselectedSelectorId={preselectedSelectorId}
        preselectedAssignmentId={preselectedAssignmentId}
      />
      <ActivateNovaModal
        open={showNovaModal}
        onClose={() => { setShowNovaModal(false); setPreselectedSelectorId(null); }}
      />
      <LogSessionModal
        open={showLogModal}
        onClose={() => { setShowLogModal(false); setPreselectedSelectorId(null); }}
        preselectedSelectorId={preselectedSelectorId}
      />
    </div>
  );
}
