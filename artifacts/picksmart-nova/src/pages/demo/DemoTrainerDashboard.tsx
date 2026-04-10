import { useState } from "react";
import {
  DEMO_SELECTORS, DEMO_ASSIGNMENTS, DEMO_SESSIONS, DEMO_STATS,
} from "@/data/demoWarehouseData";
import {
  Users, ClipboardList, Activity, Zap, CheckCircle2,
  AlertCircle, BookOpen, Shield,
} from "lucide-react";

type Tab = "Selectors" | "Assignments" | "Sessions";

export default function DemoTrainerDashboard() {
  const [tab, setTab] = useState<Tab>("Selectors");

  const selectors = DEMO_SELECTORS.filter((s) => s.role === "selector");
  const trainer   = DEMO_SELECTORS.find((s) => s.role === "trainer");

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6 pt-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="rounded-xl bg-yellow-400 p-2">
                <Shield className="h-5 w-5 text-slate-950" />
              </div>
              <h1 className="text-2xl font-black">Trainer Dashboard</h1>
            </div>
            <p className="text-slate-400 text-sm ml-11">
              Demo Distribution Center · {trainer?.fullName ?? "David Price"} (Demo Trainer)
            </p>
          </div>
          <div className="ml-11 sm:ml-0 flex items-center gap-2 text-xs text-yellow-400 border border-yellow-400/30 rounded-xl px-3 py-1.5 bg-yellow-400/5 font-bold">
            Demo Mode
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Selectors", value: DEMO_STATS.activeSelectors,   icon: <Users className="h-4 w-4 text-blue-400" /> },
            { label: "NOVA Active",      value: DEMO_STATS.activeNOVA,        icon: <Zap className="h-4 w-4 text-yellow-400" /> },
            { label: "Open Assignments", value: DEMO_STATS.openAssignments,   icon: <ClipboardList className="h-4 w-4 text-purple-400" /> },
            { label: "Sessions Today",   value: DEMO_STATS.sessionsToday,     icon: <Activity className="h-4 w-4 text-emerald-400" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs text-slate-400">{label}</p></div>
              <p className="text-2xl font-black">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800">
          {(["Selectors", "Assignments", "Sessions"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
                tab === t
                  ? "text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/5"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Selectors tab */}
        {tab === "Selectors" && (
          <div className="space-y-3">
            {selectors.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-sm text-yellow-400">
                    {s.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{s.fullName}</p>
                    <p className="text-xs text-slate-500">{s.novaId} · {s.level}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  {s.rate !== null && (
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Rate</p>
                      <p className="font-bold text-yellow-400">{s.rate}%</p>
                    </div>
                  )}
                  {s.accuracy !== null && (
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Accuracy</p>
                      <p className="font-bold text-emerald-400">{s.accuracy}%</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Modules</p>
                    <p className="font-bold text-white">{s.modulesCompleted}/6</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Progress</p>
                    <p className="font-bold text-white">{s.trainingProgress}%</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    s.novaActive
                      ? "bg-green-500/20 text-green-300"
                      : "bg-slate-700 text-slate-400"
                  }`}>
                    {s.novaActive ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />NOVA On</span>
                    ) : (
                      <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />NOVA Off</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-600 text-center pt-1">Demo data — actions disabled in preview mode</p>
          </div>
        )}

        {/* Assignments tab */}
        {tab === "Assignments" && (
          <div className="space-y-3">
            {DEMO_ASSIGNMENTS.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-white">Assignment {a.assignmentNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      a.type === "TRAINING" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
                    }`}>{a.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      a.status === "IN_PROGRESS" ? "bg-yellow-400/20 text-yellow-300"
                      : a.status === "COMPLETE" ? "bg-green-500/20 text-green-300"
                      : "bg-slate-700 text-slate-400"
                    }`}>{a.status.replace("_", " ")}</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    {a.selectorName} · Aisles {a.startAisle}–{a.endAisle} · {a.totalCases} cases · {a.pallets} pallets
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Door #{a.doorNumber} · Code {a.doorCode} · Goal: {a.goalTimeMinutes} min
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-2xl font-black text-white">{a.stops}</p>
                  <p className="text-xs text-slate-500">stops</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-600 text-center pt-1">Demo data — assign functions disabled in preview mode</p>
          </div>
        )}

        {/* Sessions tab */}
        {tab === "Sessions" && (
          <div className="space-y-3">
            {DEMO_SESSIONS.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-yellow-400" />
                      <p className="font-semibold text-white">{s.selector}</p>
                      <span className="text-xs text-slate-500">{s.novaId}</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      Assignment {s.assignment} · {s.cases} cases · {s.duration}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.date}</p>
                    {s.notes && (
                      <p className="mt-2 text-xs text-slate-400 italic">"{s.notes}"</p>
                    )}
                  </div>
                  <div className="flex gap-4 sm:text-right">
                    <div>
                      <p className="text-xs text-slate-500">Rate</p>
                      <p className="font-bold text-yellow-400">{s.rate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Accuracy</p>
                      <p className="font-bold text-emerald-400">{s.accuracy}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-600 text-center pt-1">Demo data — log session disabled in preview mode</p>
          </div>
        )}
      </div>
    </div>
  );
}
