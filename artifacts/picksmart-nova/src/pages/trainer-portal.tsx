import { useState } from "react";
import { Link } from "wouter";
import { USERS } from "@/data/users";
import { ASSIGNMENTS } from "@/data/assignments";
import { MODULES } from "@/data/modules";
import { Shield, Users, ClipboardList, BookOpen, TrendingUp, Activity, ChevronRight, Clock } from "lucide-react";

const ACTIVE_SELECTORS = USERS.filter(u => u.role === "selector" && u.isOnShift);
const TRAINER_NOTES = [
  { selector: "Deja R.", note: "Running behind on aisle 19. Check pallet build technique — Bravo side may be over capacity.", time: "18 min ago", priority: "high" },
  { selector: "James R.", note: "On pace. New to ultra-fast mode this week. Monitor but no intervention needed.", time: "32 min ago", priority: "medium" },
  { selector: "Aaliyah J.", note: "Off shift today. Complete Module 3 review before next assignment session.", time: "2 hrs ago", priority: "low" },
];

export default function TrainerPortalPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "selectors" | "modules">("overview");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 rounded-xl">
              <Shield className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Trainer Portal</h1>
              <p className="text-slate-400 text-sm">Manage selectors, assignments, and training progress</p>
            </div>
          </div>
          <Link href="/nova/control" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-yellow-400 hover:text-white text-sm transition">
            Assignment Control <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className="text-3xl font-black text-yellow-400">{ACTIVE_SELECTORS.length}</p>
            <p className="text-slate-400 text-sm mt-1">Active Selectors</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className="text-3xl font-black text-white">{ASSIGNMENTS.filter(a => a.status === "active" || a.status === "pending").length}</p>
            <p className="text-slate-400 text-sm mt-1">Open Assignments</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className="text-3xl font-black text-green-400">
              {ACTIVE_SELECTORS.filter(s => (s.performancePercent ?? 0) >= 100).length}
            </p>
            <p className="text-slate-400 text-sm mt-1">On / Above Rate</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className="text-3xl font-black text-red-400">
              {ACTIVE_SELECTORS.filter(s => s.paceStatus === "behind").length}
            </p>
            <p className="text-slate-400 text-sm mt-1">Behind Pace</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["overview", "selectors", "modules"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl font-semibold text-sm transition capitalize ${
                activeTab === tab
                  ? "bg-yellow-400 text-slate-950"
                  : "bg-slate-900 border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Trainer Notes */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-yellow-400" /> Trainer Notes
              </h2>
              <div className="space-y-4">
                {TRAINER_NOTES.map((note, i) => (
                  <div key={i} className={`rounded-xl p-4 border ${
                    note.priority === "high" ? "border-red-500/30 bg-red-500/5" :
                    note.priority === "medium" ? "border-yellow-400/30 bg-yellow-400/5" :
                    "border-slate-700 bg-slate-950"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm">{note.selector}</span>
                      <span className="text-slate-500 text-xs flex items-center gap-1"><Clock className="h-3 w-3" />{note.time}</span>
                    </div>
                    <p className="text-slate-300 text-sm">{note.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Floor Overview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-yellow-400" /> Floor Status
              </h2>
              <div className="space-y-3">
                {ACTIVE_SELECTORS.map(sel => (
                  <div key={sel.id} className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                      {sel.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">{sel.name}</p>
                      <p className="text-slate-500 text-xs">
                        {sel.currentAisle ? `Aisle ${sel.currentAisle} · Slot ${sel.currentSlot}` : "Not assigned"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm ${
                        (sel.performancePercent ?? 0) >= 100 ? "text-green-400" :
                        (sel.performancePercent ?? 0) >= 85 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {sel.performancePercent ?? 0}%
                      </p>
                      <p className={`text-xs capitalize ${
                        sel.paceStatus === "ahead" ? "text-green-500" :
                        sel.paceStatus === "behind" ? "text-red-500" :
                        sel.paceStatus === "on_pace" ? "text-yellow-500" : "text-slate-500"
                      }`}>
                        {sel.paceStatus?.replace("_", " ") ?? "idle"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/nova/tracking" className="text-sm text-yellow-400 hover:text-yellow-300 transition flex items-center gap-1">
                  View full live tracking <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "selectors" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Selector</th>
                  <th className="text-left px-5 py-3">Employee ID</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-right px-5 py-3">Avg Rate</th>
                  <th className="text-right px-5 py-3">Shifts</th>
                  <th className="text-right px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {USERS.filter(u => u.role === "selector").map(u => (
                  <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center">
                          {u.initials}
                        </div>
                        <span className="font-semibold text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">{u.employeeId}</td>
                    <td className="px-5 py-4 capitalize text-slate-300">{u.role}</td>
                    <td className="px-5 py-4 text-right font-bold text-yellow-400">{u.avgRate}%</td>
                    <td className="px-5 py-4 text-right text-slate-400">{u.shiftsCompleted}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${u.isOnShift ? "bg-green-500/10 text-green-400" : "bg-slate-800 text-slate-500"}`}>
                        {u.isOnShift ? "On Shift" : "Off"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "modules" && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {MODULES.map(mod => (
              <div key={mod.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Module {mod.number}</span>
                  {mod.isFree && <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-xs font-black">FREE</span>}
                </div>
                <h3 className="text-lg font-black text-white mb-2">{mod.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{mod.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{mod.lessons} lessons</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{mod.durationMinutes} min</span>
                  <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800">{mod.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
