import { useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { usePerformanceStore } from "@/lib/performanceStore";
import { useLocation } from "wouter";
import {
  Users, Activity, TrendingUp, TrendingDown, BarChart3,
  Briefcase, LogOut, Target, Clock, AlertCircle, Zap,
  ShieldCheck, BookOpen, CheckCircle2
} from "lucide-react";

type Tab = "team" | "performance" | "training";

const ROLE_COLOR: Record<string, string> = {
  selector: "bg-blue-500/20 text-blue-300",
  trainer: "bg-green-500/20 text-green-300",
  supervisor: "bg-orange-500/20 text-orange-300",
  manager: "bg-purple-500/20 text-purple-300",
};

export default function ManagerPage() {
  const [, navigate] = useLocation();
  const { currentUser, accounts, logout } = useAuthStore();
  const { userLogs, userGoals } = usePerformanceStore();
  const [tab, setTab] = useState<Tab>("team");

  const isManager = currentUser?.role === "manager" || currentUser?.role === "director" || currentUser?.role === "owner";
  if (!isManager) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-white text-xl font-black">Access Denied</p>
          <p className="text-slate-400 mt-2">This page is for Managers only.</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const teamAccounts = accounts.filter(
    (a) => a.id !== "master" && a.status === "active" &&
    ["selector", "trainer", "supervisor"].includes(a.role)
  );

  const performanceRows = Object.entries(userLogs).map(([username, logs]) => {
    const recent = logs.slice(-7);
    const avg = recent.length
      ? Math.round(recent.reduce((s, l) => s + l.pickRate, 0) / recent.length)
      : null;
    const goal = userGoals[username]?.targetRate ?? null;
    const trend = recent.length >= 2
      ? recent[recent.length - 1].pickRate - recent[0].pickRate
      : null;
    const todayLog = logs.find((l) => l.date === todayStr);
    return { username, avg, goal, trend, todayLog, logsCount: logs.length };
  }).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  const loggedToday = performanceRows.filter((r) => !!r.todayLog).length;
  const trending = performanceRows.filter((r) => (r.trend ?? 0) > 0).length;
  const atGoal = performanceRows.filter((r) => r.avg !== null && r.goal !== null && r.avg >= r.goal).length;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "team", label: "My Team", icon: Users },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "training", label: "Training", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/8 bg-slate-900/60 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-5 w-5 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Manager Portal</span>
            </div>
            <h1 className="text-2xl font-black text-white">Welcome, {currentUser?.fullName?.split(" ")[0]}</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage your team and track performance</p>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Team Members", value: teamAccounts.length, icon: Users, color: "text-blue-400 bg-blue-500/15" },
            { label: "Active Today", value: loggedToday, icon: Activity, color: "text-green-400 bg-green-500/15" },
            { label: "Trending Up", value: trending, icon: TrendingUp, color: "text-yellow-400 bg-yellow-500/15" },
            { label: "Hitting Goal", value: atGoal, icon: Target, color: "text-violet-400 bg-violet-500/15" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/8 bg-slate-900 p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-900 p-1.5 rounded-2xl border border-white/8 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t.id ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* My Team */}
        {tab === "team" && (
          <div className="rounded-2xl border border-white/8 bg-slate-900 overflow-hidden">
            {teamAccounts.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">No team members yet</p>
                <p className="text-slate-600 text-sm mt-1">Your director can add team members via invite links.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-3.5 border-b border-white/8 grid grid-cols-4 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span className="col-span-2">Member</span>
                  <span>Role</span>
                  <span>Status</span>
                </div>
                <div className="divide-y divide-white/5">
                  {teamAccounts.map((acc) => {
                    const hasLoggedToday = (userLogs[acc.username] ?? []).some((l) => l.date === todayStr);
                    return (
                      <div key={acc.id} className="px-6 py-3.5 grid grid-cols-4 gap-4 items-center">
                        <div className="col-span-2 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                            {acc.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{acc.fullName}</p>
                            <p className="text-slate-500 text-xs">@{acc.username}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize w-fit ${ROLE_COLOR[acc.role] ?? "bg-slate-500/20 text-slate-300"}`}>
                          {acc.role}
                        </span>
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${hasLoggedToday ? "text-green-400" : "text-slate-500"}`}>
                          {hasLoggedToday
                            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Active</>
                            : <><Clock className="h-3.5 w-3.5" /> No log today</>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Performance */}
        {tab === "performance" && (
          <div className="rounded-2xl border border-white/8 bg-slate-900 overflow-hidden">
            {performanceRows.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <BarChart3 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">No performance data yet</p>
                <p className="text-slate-600 text-sm mt-1">Selectors log pick rate on the Leaderboard page. Their data will appear here.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-3.5 border-b border-white/8 grid grid-cols-5 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span className="col-span-2">Selector</span>
                  <span className="text-center">7-Day Avg</span>
                  <span className="text-center">Goal</span>
                  <span className="text-center">Trend</span>
                </div>
                <div className="divide-y divide-white/5">
                  {performanceRows.map((row, i) => (
                    <div key={row.username} className="px-6 py-4 grid grid-cols-5 gap-4 items-center">
                      <div className="col-span-2 flex items-center gap-3">
                        <span className="text-xs font-black w-5 text-slate-500">#{i + 1}</span>
                        <div>
                          <p className="text-white text-sm font-semibold">{row.username}</p>
                          <p className="text-slate-600 text-xs">{row.logsCount} days logged</p>
                        </div>
                      </div>
                      <div className="text-center">
                        {row.avg !== null ? (
                          <span className={`text-lg font-black ${row.avg >= 100 ? "text-green-400" : row.avg >= 90 ? "text-yellow-400" : "text-red-400"}`}>
                            {row.avg}%
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </div>
                      <div className="text-center">
                        {row.goal ? (
                          <span className="text-violet-300 text-sm font-bold">{row.goal}%</span>
                        ) : <span className="text-slate-600 text-sm">—</span>}
                      </div>
                      <div className="text-center">
                        {row.trend !== null ? (
                          row.trend > 0
                            ? <span className="text-green-400 text-sm font-bold">↑ +{row.trend}%</span>
                            : row.trend < 0
                              ? <span className="text-red-400 text-sm font-bold">↓ {row.trend}%</span>
                              : <span className="text-slate-500 text-sm">Flat</span>
                        ) : <span className="text-slate-600 text-sm">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Training overview */}
        {tab === "training" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-slate-900 p-6">
              <h2 className="text-white font-black text-lg mb-4">Training Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Training Modules", href: "/training", icon: BookOpen, desc: "6 modules covering all warehouse skills" },
                  { label: "NOVA Help", href: "/nova-help", icon: Zap, desc: "AI voice coach for your team" },
                  { label: "Trainer Portal", href: "/trainer-portal", icon: ShieldCheck, desc: "Assign and track learning sessions" },
                  { label: "Supervisor Dashboard", href: "/supervisor", icon: Users, desc: "Shift management and overviews" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 rounded-xl border border-white/8 bg-slate-800 px-5 py-4 hover:border-white/20 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold group-hover:text-purple-300 transition">{item.label}</p>
                      <p className="text-slate-500 text-xs">{item.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
