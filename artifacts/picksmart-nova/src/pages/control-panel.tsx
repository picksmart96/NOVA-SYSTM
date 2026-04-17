import { useState, useMemo, useEffect } from "react";
import { useAuthStore, AuthAccount } from "@/lib/authStore";
import { usePerformanceStore } from "@/lib/performanceStore";
import { useLocation } from "wouter";
import {
  Users, Activity, TrendingUp, TrendingDown, Copy, Check,
  ShieldCheck, Briefcase, BarChart3, Zap, LogOut,
  UserPlus, Link as LinkIcon, Eye, EyeOff, Star,
  CheckCircle2, AlertCircle, Clock, Target, X
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function copyToClipboard(text: string, onDone: () => void) {
  navigator.clipboard.writeText(text).then(onDone);
}

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-900 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-sm font-semibold text-slate-300 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

type Tab = "overview" | "performance" | "invite";

export default function ControlPanelPage() {
  const [, navigate] = useLocation();
  const { currentUser, accounts, logout } = useAuthStore();
  const { userLogs, userGoals } = usePerformanceStore();

  const [tab, setTab] = useState<Tab>("overview");
  const [copiedSup, setCopiedSup] = useState(false);
  const [copiedMgr, setCopiedMgr] = useState(false);
  const [showSupLink, setShowSupLink] = useState(false);
  const [showMgrLink, setShowMgrLink] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AuthAccount | null>(null);

  const isOwner = currentUser?.role === "owner";
  const isDirector = currentUser?.role === "director" || isOwner;
  if (!isDirector) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-white text-xl font-black">Access Denied</p>
          <p className="text-slate-400 mt-2">This page is for Directors only.</p>
        </div>
      </div>
    );
  }

  const realAccounts = accounts.filter((a) => a.id !== "master");
  const activeAccounts = realAccounts.filter((a) => a.status === "active");
  const bannedAccounts = realAccounts.filter((a) => a.status === "banned");
  const selectors = realAccounts.filter((a) => a.role === "selector");
  const trainers = realAccounts.filter((a) => a.role === "trainer");
  const supervisors = realAccounts.filter((a) => a.role === "supervisor");
  const managers = realAccounts.filter((a) => a.role === "manager");

  const allLoggedUsers = Object.keys(userLogs);
  const todayStr = new Date().toISOString().slice(0, 10);
  const loggedTodayCount = allLoggedUsers.filter((u) => {
    const logs = userLogs[u] ?? [];
    return logs.some((l) => l.date === todayStr);
  }).length;

  const performanceRows = useMemo(() => {
    return allLoggedUsers.map((username) => {
      const logs = userLogs[username] ?? [];
      const recent = logs.slice(-7);
      const avg = recent.length
        ? Math.round(recent.reduce((s, l) => s + l.pickRate, 0) / recent.length)
        : null;
      const goal = userGoals[username]?.targetRate ?? null;
      const todayLog = logs.find((l) => l.date === todayStr);
      const trend = recent.length >= 2
        ? recent[recent.length - 1].pickRate - recent[0].pickRate
        : null;
      return { username, avg, goal, todayLog, trend, logsCount: logs.length };
    }).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  }, [userLogs, userGoals]);

  const [supLink, setSupLink] = useState("");
  const [mgrLink, setMgrLink] = useState("");

  useEffect(() => {
    async function generateLinks() {
      const raw = localStorage.getItem("picksmart-auth-store");
      const jwt = raw ? (JSON.parse(raw) as { state?: { jwtToken?: string } })?.state?.jwtToken : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

      for (const role of ["supervisor", "manager"] as const) {
        try {
          const res = await fetch("/api/auth/invite", {
            method: "POST",
            headers,
            body: JSON.stringify({
              fullName: "Team Member",
              email: "",
              role,
              warehouseId: currentUser?.warehouseId ?? null,
              warehouseSlug: currentUser?.warehouseSlug ?? null,
            }),
          });
          if (res.ok) {
            const { token } = await res.json() as { token: string };
            const url = `${window.location.origin}/invite/${token}`;
            if (role === "supervisor") setSupLink(url);
            else setMgrLink(url);
          }
        } catch { /* silent */ }
      }
    }
    void generateLinks();
  }, [currentUser?.warehouseId, currentUser?.warehouseSlug]);

  function copySup() {
    copyToClipboard(supLink, () => { setCopiedSup(true); setTimeout(() => setCopiedSup(false), 2500); });
  }
  function copyMgr() {
    copyToClipboard(mgrLink, () => { setCopiedMgr(true); setTimeout(() => setCopiedMgr(false), 2500); });
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "invite", label: "Invite Links", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/8 bg-slate-900/60 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-5 w-5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Control Panel</span>
            </div>
            <h1 className="text-2xl font-black text-white">Director Dashboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Welcome back, <span className="text-white font-semibold">{currentUser?.fullName}</span>
            </p>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:border-white/20 transition"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-900 p-1.5 rounded-2xl border border-white/8 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t.id
                  ? "bg-yellow-400 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Users" value={realAccounts.length}
                sub={`${activeAccounts.length} active`}
                icon={Users} color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                label="Logged In Today" value={loggedTodayCount}
                sub="based on performance logs"
                icon={Activity} color="bg-green-500/20 text-green-400"
              />
              <StatCard
                label="Selectors" value={selectors.length}
                sub={`${trainers.length} trainers`}
                icon={Zap} color="bg-yellow-500/20 text-yellow-400"
              />
              <StatCard
                label="Supervisors" value={supervisors.length}
                sub={`${managers.length} managers`}
                icon={ShieldCheck} color="bg-violet-500/20 text-violet-400"
              />
            </div>

            {/* Team roster */}
            <div className="rounded-2xl border border-white/8 bg-slate-900 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <h2 className="font-black text-white text-lg">Team Roster</h2>
                <p className="text-slate-400 text-sm">All active users in your organization</p>
              </div>
              {activeAccounts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No team members yet. Use Invite Links to add your team.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {activeAccounts.map((acc) => {
                    const roleColors: Record<string, string> = {
                      selector: "bg-blue-500/20 text-blue-300",
                      trainer: "bg-green-500/20 text-green-300",
                      supervisor: "bg-orange-500/20 text-orange-300",
                      manager: "bg-purple-500/20 text-purple-300",
                      director: "bg-yellow-500/20 text-yellow-300",
                      owner: "bg-red-500/20 text-red-300",
                    };
                    const colorCls = roleColors[acc.role] ?? "bg-slate-500/20 text-slate-300";
                    const hasLoggedToday = (userLogs[acc.username] ?? []).some((l) => l.date === todayStr);
                    const sessionCount = (userLogs[acc.username] ?? []).length;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedUser(acc)}
                        className="px-6 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            {acc.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{acc.fullName}</p>
                            <p className="text-slate-500 text-xs">@{acc.username} · {sessionCount} session{sessionCount !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {hasLoggedToday && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Activity className="h-3 w-3" /> Active today
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${colorCls}`}>
                            {acc.role}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {bannedAccounts.length > 0 && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4">
                <p className="text-red-400 font-bold text-sm">
                  {bannedAccounts.length} banned account{bannedAccounts.length > 1 ? "s" : ""} — contact your admin to review.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── PERFORMANCE ── */}
        {tab === "performance" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/8 bg-slate-900 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-white text-lg">Selector Performance</h2>
                  <p className="text-slate-400 text-sm">7-day pick rate averages from self-logged data</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" /> Updated as selectors log
                </div>
              </div>

              {performanceRows.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <BarChart3 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-semibold">No performance data yet</p>
                  <p className="text-slate-600 text-sm mt-1">Selectors log their pick rate on the Leaderboard page. Data appears here automatically.</p>
                </div>
              ) : (
                <>
                  <div className="px-6 py-3 border-b border-white/5 grid grid-cols-5 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="col-span-2">Selector</span>
                    <span className="text-center">7-Day Avg</span>
                    <span className="text-center">Goal</span>
                    <span className="text-center">Trend</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {performanceRows.map((row, i) => (
                      <div key={row.username} className="px-6 py-4 grid grid-cols-5 gap-4 items-center">
                        <div className="col-span-2 flex items-center gap-3">
                          <span className={`text-xs font-black w-5 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-600"}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </span>
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
                          ) : (
                            <span className="text-slate-600 text-sm">—</span>
                          )}
                        </div>
                        <div className="text-center">
                          {row.goal ? (
                            <div className="flex items-center justify-center gap-1">
                              <Target className="h-3.5 w-3.5 text-violet-400" />
                              <span className="text-violet-300 text-sm font-bold">{row.goal}%</span>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-sm">No goal</span>
                          )}
                        </div>
                        <div className="text-center">
                          {row.trend !== null ? (
                            row.trend > 0 ? (
                              <span className="flex items-center justify-center gap-1 text-green-400 text-sm font-bold">
                                <TrendingUp className="h-3.5 w-3.5" /> +{row.trend}%
                              </span>
                            ) : row.trend < 0 ? (
                              <span className="flex items-center justify-center gap-1 text-red-400 text-sm font-bold">
                                <TrendingDown className="h-3.5 w-3.5" /> {row.trend}%
                              </span>
                            ) : (
                              <span className="text-slate-500 text-sm">Flat</span>
                            )
                          ) : (
                            <span className="text-slate-600 text-sm">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Today summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-1">At or Above Goal</p>
                <p className="text-3xl font-black text-white">
                  {performanceRows.filter((r) => r.avg !== null && r.goal !== null && r.avg >= r.goal).length}
                </p>
                <p className="text-slate-500 text-xs mt-1">selectors hitting their weekly target</p>
              </div>
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">Tracking Up</p>
                <p className="text-3xl font-black text-white">
                  {performanceRows.filter((r) => (r.trend ?? 0) > 0).length}
                </p>
                <p className="text-slate-500 text-xs mt-1">showing improvement this week</p>
              </div>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Logged Today</p>
                <p className="text-3xl font-black text-white">{loggedTodayCount}</p>
                <p className="text-slate-500 text-xs mt-1">selectors active today</p>
              </div>
            </div>
          </div>
        )}

        {/* ── INVITE LINKS ── */}
        {tab === "invite" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
              <p className="text-yellow-300 text-sm font-bold mb-1">How invite links work</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Copy the link for the role you want to share and send it to your team members. Anyone who uses the link will sign up with that role automatically. Supervisors and managers who join via these links <span className="text-white font-semibold">cannot see this Control Panel</span> — only Directors can.
              </p>
            </div>

            {/* Supervisor Link */}
            <div className="rounded-2xl border border-white/8 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-white font-black">Supervisor Invite Link</h3>
                  <p className="text-slate-400 text-sm">Anyone who uses this link joins as a Supervisor</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-800 border border-white/8 px-4 py-3">
                <LinkIcon className="h-4 w-4 text-slate-500 shrink-0" />
                <p className="text-slate-300 text-sm font-mono flex-1 truncate">
                  {showSupLink ? supLink : supLink.replace(/\/invite\/.+/, "/invite/••••••••••")}
                </p>
                <button
                  onClick={() => setShowSupLink((v) => !v)}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  {showSupLink ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copySup}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3 font-bold text-white transition"
                >
                  {copiedSup ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Supervisor Link</>}
                </button>
              </div>
            </div>

            {/* Manager Link */}
            <div className="rounded-2xl border border-white/8 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-black">Manager Invite Link</h3>
                  <p className="text-slate-400 text-sm">Anyone who uses this link joins as a Manager</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-800 border border-white/8 px-4 py-3">
                <LinkIcon className="h-4 w-4 text-slate-500 shrink-0" />
                <p className="text-slate-300 text-sm font-mono flex-1 truncate">
                  {showMgrLink ? mgrLink : mgrLink.replace(/\/invite\/.+/, "/invite/••••••••••")}
                </p>
                <button
                  onClick={() => setShowMgrLink((v) => !v)}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  {showMgrLink ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyMgr}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-3 font-bold text-white transition"
                >
                  {copiedMgr ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Manager Link</>}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900 p-5">
              <p className="text-slate-500 text-xs leading-relaxed">
                These links are permanent and reusable — you can share them in a group chat, email, or post. Each person who joins creates their own unique username and password. You can always see who's joined in the <button onClick={() => setTab("overview")} className="text-yellow-400 underline">Overview</button> tab.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4 pb-4 sm:pb-0"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center font-black text-yellow-400 text-sm">
                  {selectedUser.fullName[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-white">{selectedUser.fullName}</p>
                  <p className="text-xs text-slate-500">@{selectedUser.username}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-4">
              {/* Role badge */}
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const roleColors: Record<string, string> = {
                    selector: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                    trainer: "bg-green-500/20 text-green-300 border-green-500/30",
                    supervisor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
                    manager: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                    director: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
                    owner: "bg-red-500/20 text-red-300 border-red-500/30",
                  };
                  return (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border capitalize ${roleColors[selectedUser.role] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                      {selectedUser.role}
                    </span>
                  );
                })()}
                <span className={`text-xs font-bold px-3 py-1 rounded-full border capitalize ${
                  selectedUser.status === "active"
                    ? "bg-green-500/10 text-green-300 border-green-500/30"
                    : selectedUser.status === "banned"
                    ? "bg-red-500/10 text-red-300 border-red-500/30"
                    : "bg-slate-700 text-slate-400 border-slate-600"
                }`}>{selectedUser.status}</span>
                {selectedUser.subscriptionPlan && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full border capitalize bg-yellow-500/10 text-yellow-300 border-yellow-500/30">
                    {selectedUser.subscriptionPlan}
                  </span>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-800 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Account #</p>
                  <p className="font-black text-yellow-400 text-sm">{selectedUser.accountNumber ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-slate-800 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Sessions</p>
                  <p className="font-black text-white text-sm">{(userLogs[selectedUser.username] ?? []).length}</p>
                </div>
                <div className="rounded-xl bg-slate-800 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Joined</p>
                  <p className="font-black text-white text-sm">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "—"}</p>
                </div>
                <div className="rounded-xl bg-slate-800 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Logged Today</p>
                  <p className={`font-black text-sm ${(userLogs[selectedUser.username] ?? []).some((l) => l.date === new Date().toISOString().slice(0,10)) ? "text-green-400" : "text-slate-500"}`}>
                    {(userLogs[selectedUser.username] ?? []).some((l) => l.date === new Date().toISOString().slice(0,10)) ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              {selectedUser.email && (
                <div className="rounded-xl bg-slate-800 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-white text-sm break-all">{selectedUser.email}</p>
                </div>
              )}
              {selectedUser.companyName && (
                <div className="rounded-xl bg-slate-800 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Company</p>
                  <p className="text-white text-sm">{selectedUser.companyName}</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full rounded-xl border border-slate-700 py-2.5 text-sm font-bold text-slate-300 hover:border-slate-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
