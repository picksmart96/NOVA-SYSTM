import { useState } from "react";
import {
  DEMO_SELECTORS, DEMO_ASSIGNMENTS, DEMO_SESSIONS,
  DEMO_STATS, DEMO_ACTIVITY,
} from "@/data/demoWarehouseData";
import {
  Users, Activity, Zap, TrendingUp, ClipboardList,
  CheckCircle2, AlertCircle, ShieldAlert, BookOpen, BarChart3,
} from "lucide-react";

type Tab = "Overview" | "Selectors" | "Trainers" | "Assignments" | "Sessions";

export default function DemoSupervisorDashboard() {
  const [tab, setTab] = useState<Tab>("Overview");

  const selectors  = DEMO_SELECTORS.filter((s) => s.role === "selector");
  const trainers   = DEMO_SELECTORS.filter((s) => s.role === "trainer");
  const supervisor = DEMO_SELECTORS.find((s) => s.role === "supervisor");

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6 pt-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="rounded-xl bg-rose-500 p-2">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-black">Supervisor Dashboard</h1>
            </div>
            <p className="text-slate-400 text-sm ml-11">
              Demo Distribution Center · {supervisor?.fullName ?? "Sonia Ramirez"} (Demo Supervisor)
            </p>
          </div>
          <div className="ml-11 sm:ml-0 flex items-center gap-2 text-xs text-yellow-400 border border-yellow-400/30 rounded-xl px-3 py-1.5 bg-yellow-400/5 font-bold">
            Demo Mode
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800 overflow-x-auto">
          {(["Overview", "Selectors", "Trainers", "Assignments", "Sessions"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition whitespace-nowrap ${
                tab === t
                  ? "text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/5"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { label: "Total Users",       value: DEMO_STATS.totalUsers,       icon: <Users className="h-4 w-4 text-blue-400" />,    color: "text-white" },
                { label: "Active Selectors",  value: DEMO_STATS.activeSelectors,  icon: <Users className="h-4 w-4 text-blue-400" />,    color: "text-white" },
                { label: "NOVA Active",       value: DEMO_STATS.activeNOVA,       icon: <Zap className="h-4 w-4 text-yellow-400" />,    color: "text-yellow-400" },
                { label: "Sessions Today",    value: DEMO_STATS.sessionsToday,    icon: <Activity className="h-4 w-4 text-emerald-400" />, color: "text-emerald-400" },
                { label: "Pass Rate",         value: `${DEMO_STATS.passRate}%`,   icon: <TrendingUp className="h-4 w-4 text-green-400" />, color: "text-green-400" },
                { label: "Avg Rate",          value: `${DEMO_STATS.avgRate}%`,    icon: <BarChart3 className="h-4 w-4 text-purple-400" />, color: "text-purple-400" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs text-slate-400">{label}</p></div>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="font-bold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {DEMO_ACTIVITY.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                    <Activity className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-200">{item.text}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1.5 w-24 rounded-full bg-slate-700">
                        <div className="h-1.5 rounded-full bg-yellow-400" style={{ width: `${s.trainingProgress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{s.trainingProgress}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  {s.rate !== null && <div className="text-center"><p className="text-xs text-slate-500">Rate</p><p className="font-bold text-yellow-400">{s.rate}%</p></div>}
                  {s.accuracy !== null && <div className="text-center"><p className="text-xs text-slate-500">Acc</p><p className="font-bold text-emerald-400">{s.accuracy}%</p></div>}
                  <div className="text-center"><p className="text-xs text-slate-500">Modules</p><p className="font-bold text-white">{s.modulesCompleted}/6</p></div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${s.novaActive ? "bg-green-500/20 text-green-300" : "bg-slate-700 text-slate-400"}`}>
                    {s.novaActive ? <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />NOVA On</span>
                      : <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Off</span>}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-600 text-center pt-1">Demo data — management actions disabled in preview</p>
          </div>
        )}

        {/* Trainers tab */}
        {tab === "Trainers" && (
          <div className="space-y-3">
            {trainers.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-black text-sm text-purple-400">
                    {t.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t.fullName}</p>
                    <p className="text-xs text-slate-500">{t.novaId} · {t.level}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-purple-500/20 text-purple-300">Trainer</span>
              </div>
            ))}
            <p className="text-xs text-slate-600 text-center pt-1">Demo data — invite trainer disabled in preview</p>
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${a.type === "TRAINING" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"}`}>{a.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${a.status === "IN_PROGRESS" ? "bg-yellow-400/20 text-yellow-300" : "bg-slate-700 text-slate-400"}`}>{a.status.replace("_", " ")}</span>
                  </div>
                  <p className="text-sm text-slate-300">{a.selectorName} · Aisles {a.startAisle}–{a.endAisle} · {a.totalCases} cases · {a.pallets} pallets</p>
                  <p className="text-xs text-slate-500 mt-0.5">Door #{a.doorNumber} · Code {a.doorCode}</p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-2xl font-black text-white">{a.stops}</p>
                  <p className="text-xs text-slate-500">stops</p>
                </div>
              </div>
            ))}
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
                    <p className="text-sm text-slate-300">Assignment {s.assignment} · {s.cases} cases · {s.duration}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.date}</p>
                    {s.notes && <p className="mt-2 text-xs text-slate-400 italic">"{s.notes}"</p>}
                  </div>
                  <div className="flex gap-4 sm:text-right">
                    <div><p className="text-xs text-slate-500">Rate</p><p className="font-bold text-yellow-400">{s.rate}%</p></div>
                    <div><p className="text-xs text-slate-500">Accuracy</p><p className="font-bold text-emerald-400">{s.accuracy}%</p></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
