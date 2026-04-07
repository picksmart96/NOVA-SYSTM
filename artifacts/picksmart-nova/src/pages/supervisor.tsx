import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAccessStore } from "@/lib/accessStore";
import { useTrainerStore } from "@/lib/trainerStore";
import { useAuthStore } from "@/lib/authStore";
import {
  Activity, Users, Zap, BookOpen, TrendingUp, Radio,
  MapPin, LogOut, Copy, Send, UserPlus, Check
} from "lucide-react";

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const TABS = ["Overview", "Activate NOVA", "Selectors", "Sessions"] as const;
type Tab = typeof TABS[number];

export default function SupervisorPage() {
  const [, navigate] = useLocation();
  const { logout } = useAuthStore();
  const { trainerInviteRequests, novaSessions, stopNovaSession } = useAccessStore();
  const { selectors, sessions } = useTrainerStore();
  const { addInvite } = useAuthStore();

  const [tab, setTab] = useState<Tab>("Overview");
  const [trainerName, setTrainerName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const handleSendInvite = () => {
    if (!trainerName.trim() || !trainerEmail.trim()) return;
    const token = addInvite({ fullName: trainerName.trim(), email: trainerEmail.trim(), role: "trainer" });
    setInviteToken(token);
    setTrainerName("");
    setTrainerEmail("");
  };

  const generatedInviteUrl = inviteToken ? `${window.location.origin}/invite/${inviteToken}` : null;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1800);
    } catch { /* silent */ }
  };

  const activeNovaCount = selectors.filter((s) => s.novaActive).length;
  const openCount = selectors.filter((s) => s.assignedAssignmentId).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center">
                <Radio className="h-5 w-5 text-slate-950" />
              </div>
              <h1 className="text-4xl font-black">Supervisor Dashboard</h1>
            </div>
            <p className="text-slate-400">soumaila ouedraogo · NOVA ES3 D2S</p>
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

        {/* Stats row */}
        <div className="grid sm:grid-cols-5 gap-4">
          {[
            { label: "Open", value: openCount, icon: Activity },
            { label: "Selectors", value: selectors.length, icon: Users },
            { label: "NOVA Active", value: activeNovaCount, icon: Zap },
            { label: "Sessions", value: sessions.length, icon: BookOpen },
            { label: "Pass rate", value: "0%", icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-slate-500" />
                <p className="text-slate-400 text-sm font-medium">{label}</p>
              </div>
              <p className="text-4xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Copy toast */}
        {copied && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300 text-sm font-bold">
            Copied: {copied}
          </div>
        )}

        {/* Trainer Invite */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-yellow-400" /> Send Trainer Invite URL
          </h2>

          <div className="grid lg:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Full Name</label>
              <input
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                placeholder="Trainer name"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                value={trainerEmail}
                onChange={(e) => setTrainerEmail(e.target.value)}
                placeholder="trainer@email.com"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
              />
            </div>
            <button
              onClick={handleSendInvite}
              disabled={!trainerName.trim() || !trainerEmail.trim()}
              className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" /> Generate Invite
            </button>
          </div>

          {generatedInviteUrl && (
            <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-green-300 text-sm font-bold mb-3 flex items-center gap-2">
                <Check className="h-4 w-4" /> Invite link generated — share this with the trainer:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-slate-300 break-all">
                  {generatedInviteUrl}
                </div>
                <button
                  onClick={() => handleCopy(generatedInviteUrl, "Invite URL")}
                  className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold hover:border-yellow-400 transition flex items-center gap-2 shrink-0"
                >
                  <Copy className="h-4 w-4" /> {copied === "Invite URL" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trainer Access Requests */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-6">Trainer Access Requests</h2>

          {trainerInviteRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-400 text-sm">
              No trainer requests yet.
            </div>
          ) : (
            <div className="space-y-4">
              {trainerInviteRequests.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <h3 className="text-base font-bold capitalize">{req.fullName}</h3>
                  <p className="mt-1 text-slate-400 text-sm">{req.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-300 border border-yellow-500/30">
                      {req.requestedRole}
                    </span>
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-slate-300 break-all">
              {trainerSignupUrl}
            </div>
            <button
              onClick={() => handleCopy(trainerSignupUrl, "Signup URL")}
              className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold hover:border-yellow-400 transition flex items-center gap-2 shrink-0"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-3">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm font-bold border transition ${
                tab === t
                  ? "bg-yellow-400 text-slate-950 border-yellow-400"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-yellow-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "Overview" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectors.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="font-black capitalize">{s.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{s.novaId} · Age {s.age}</p>
                <p className="text-slate-400 text-sm">{s.experience}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-bold text-yellow-300 border border-yellow-500/30">{s.level}</span>
                  {s.novaActive && <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-300 border border-green-500/30">NOVA Active</span>}
                  {s.assignedAssignmentId && <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">Assigned</span>}
                </div>
              </div>
            ))}
            {selectors.length === 0 && (
              <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
                No selectors registered yet.
              </div>
            )}
          </div>
        )}

        {tab === "Selectors" && (
          <div className="space-y-4">
            {selectors.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-black capitalize">{s.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{s.novaId} · Level: {s.level} · Age {s.age}</p>
                  <p className="text-slate-400 text-sm">{s.experience}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.novaActive && <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300 border border-green-500/30">NOVA Active</span>}
                  {s.assignedAssignmentId ? <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">Has Assignment</span> : <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-slate-400 border border-slate-600">Unassigned</span>}
                </div>
              </div>
            ))}
            {selectors.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">No selectors yet.</div>}
          </div>
        )}

        {tab === "Sessions" && (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black capitalize">{session.selectorName}</h3>
                    <p className="text-slate-400 text-sm mt-1">{session.sessionType} · by {session.trainerName}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(session.createdAt)}</span>
                </div>
                {session.notes && <p className="mt-3 text-slate-300 text-sm border-t border-slate-800 pt-3">{session.notes}</p>}
              </div>
            ))}
            {sessions.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">No sessions logged yet.</div>}
          </div>
        )}

        {tab === "Activate NOVA" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Use the <Link href="/trainer-portal"><span className="text-yellow-400 font-bold cursor-pointer hover:underline">Trainer Dashboard</span></Link> to activate NOVA for individual selectors.
          </div>
        )}

        {/* Active NOVA Sessions */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" /> Active NOVA Sessions
          </h2>

          {novaSessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-400 text-sm">
              No active NOVA sessions.
            </div>
          ) : (
            <div className="space-y-4">
              {novaSessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h3 className="font-bold capitalize">{session.selectorName} · {session.novaId}</h3>
                      <p className="mt-1 text-slate-300 text-sm">{session.assignmentTitle} · by {session.trainerName}</p>
                      <p className="mt-1 text-slate-500 text-xs">{formatDate(session.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => stopNovaSession(session.id)}
                      className="rounded-2xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
