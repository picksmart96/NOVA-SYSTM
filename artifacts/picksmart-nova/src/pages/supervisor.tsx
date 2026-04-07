import { Link } from "wouter";
import { getActiveSelectors, USERS } from "@/data/users";
import { ASSIGNMENTS } from "@/data/assignments";
import { Activity, AlertTriangle, TrendingUp, Clock, Users, ChevronRight, Radio } from "lucide-react";

const ALERTS = [
  { type: "warning", message: "Deja Roberts — Assignment 251737 running 9% behind goal pace", time: "4 min ago" },
  { type: "info", message: "Carlos Mendez — Assignment 251738 completed. Pallet en route to door 15.", time: "12 min ago" },
  { type: "warning", message: "Slot 19-A03 reported as short. Inventory team notified.", time: "27 min ago" },
];

export default function SupervisorPage() {
  const activeSelectors = getActiveSelectors();
  const openAssignments = ASSIGNMENTS.filter(a => a.status === "active" || a.status === "pending");
  const completedToday = ASSIGNMENTS.filter(a => a.status === "completed");
  const avgPerf = Math.round(activeSelectors.reduce((sum, s) => sum + (s.performancePercent ?? 0), 0) / Math.max(1, activeSelectors.length));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 rounded-xl">
              <Radio className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Supervisor Dashboard</h1>
              <p className="text-slate-400 text-sm">Real-time floor overview and operations control</p>
            </div>
          </div>
          <Link href="/nova/tracking" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-yellow-400 hover:text-white text-sm transition">
            Live Tracking <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className="text-4xl font-black text-yellow-400">{activeSelectors.length}</p>
            <p className="text-slate-400 text-sm mt-1">Active Selectors</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className="text-4xl font-black text-white">{openAssignments.length}</p>
            <p className="text-slate-400 text-sm mt-1">Open Assignments</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className={`text-4xl font-black ${avgPerf >= 100 ? "text-green-400" : avgPerf >= 85 ? "text-yellow-400" : "text-red-400"}`}>
              {avgPerf}%
            </p>
            <p className="text-slate-400 text-sm mt-1">Avg Floor Rate</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className="text-4xl font-black text-green-400">{completedToday.length}</p>
            <p className="text-slate-400 text-sm mt-1">Completed Today</p>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" /> Active Alerts
          </h2>
          <div className="space-y-3">
            {ALERTS.map((alert, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl p-4 border ${
                alert.type === "warning"
                  ? "border-yellow-400/30 bg-yellow-400/5"
                  : "border-slate-700 bg-slate-950"
              }`}>
                <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${alert.type === "warning" ? "text-yellow-400" : "text-slate-500"}`} />
                <div className="flex-1">
                  <p className="text-white text-sm">{alert.message}</p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" />{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floor Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Users className="h-4 w-4 text-yellow-400" /> Active Selectors
            </h2>
            <Link href="/nova/tracking" className="text-sm text-yellow-400 hover:text-yellow-300 transition flex items-center gap-1">
              Full tracking view <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeSelectors.map(sel => {
              const assignment = ASSIGNMENTS.find(a => a.id === sel.currentAssignmentId);
              return (
                <div key={sel.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                      {sel.initials}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{sel.name}</p>
                      <p className="text-slate-500 text-xs">{sel.employeeId}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className={`text-xl font-black ${
                        (sel.performancePercent ?? 0) >= 100 ? "text-green-400" :
                        (sel.performancePercent ?? 0) >= 85 ? "text-yellow-400" : "text-red-400"
                      }`}>{sel.performancePercent ?? 0}%</p>
                      <p className={`text-xs font-semibold capitalize ${
                        sel.paceStatus === "ahead" ? "text-green-500" :
                        sel.paceStatus === "behind" ? "text-red-500" :
                        sel.paceStatus === "on_pace" ? "text-yellow-500" : "text-slate-500"
                      }`}>{sel.paceStatus?.replace("_", " ") ?? "idle"}</p>
                    </div>
                  </div>

                  {assignment && (
                    <div className="text-xs text-slate-500 mb-3">
                      Assignment #{assignment.assignmentNumber} · {assignment.title}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
                      <p className="text-slate-500 mb-0.5">Current</p>
                      <p className="font-mono text-white font-bold">
                        {sel.currentAisle ? `Aisle ${sel.currentAisle} · ${sel.currentSlot}` : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
                      <p className="text-slate-500 mb-0.5">Next</p>
                      <p className="font-mono text-white font-bold">
                        {sel.nextAisle ? `Aisle ${sel.nextAisle} · ${sel.nextSlot}` : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
                      <p className="text-slate-500 mb-0.5">Elapsed</p>
                      <p className="font-mono text-white font-bold">
                        {sel.elapsedMinutes != null ? `${sel.elapsedMinutes}m` : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
                      <p className="text-slate-500 mb-0.5">Dwell</p>
                      <p className={`font-mono font-bold ${(sel.dwellSeconds ?? 0) > 45 ? "text-red-400" : "text-white"}`}>
                        {sel.dwellSeconds != null ? `${sel.dwellSeconds}s` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assignment Overview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Assignment Overview</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="text-left px-6 py-3">Assignment</th>
                <th className="text-left px-6 py-3">Selector</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Progress</th>
                <th className="text-right px-6 py-3">Goal</th>
              </tr>
            </thead>
            <tbody>
              {ASSIGNMENTS.map(a => {
                const selector = USERS.find(u => u.id === a.selectorUserId);
                return (
                  <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono font-bold text-white">#{a.assignmentNumber}</td>
                    <td className="px-6 py-4 text-slate-300">{selector?.name ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                        a.status === "active" ? "bg-yellow-400/10 text-yellow-400" :
                        a.status === "completed" ? "bg-green-500/10 text-green-400" :
                        "bg-slate-800 text-slate-400"
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">{a.percentComplete}%</td>
                    <td className="px-6 py-4 text-right text-slate-400">{a.goalTimeMinutes}m</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
