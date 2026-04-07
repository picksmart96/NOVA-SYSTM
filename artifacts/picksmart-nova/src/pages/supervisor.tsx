import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAccessStore } from "@/lib/accessStore";
import { useTrainerStore } from "@/lib/trainerStore";
import { useAuthStore } from "@/lib/authStore";
import { AssignAssignmentModal } from "@/components/nova/AssignAssignmentModal";
import { useTranslation } from "react-i18next";
import {
  Activity, Users, Zap, BookOpen, TrendingUp, Radio,
  MapPin, LogOut, Copy, Send, UserPlus, Check,
  ClipboardList, CheckCircle2, AlertCircle, DoorOpen, KeyRound,
  Trash2, UserCheck, ShieldAlert
} from "lucide-react";

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const TABS = ["Overview", "Assignments", "Activate NOVA", "Selectors", "Trainers", "Sessions"] as const;
type Tab = typeof TABS[number];

export default function SupervisorPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { logout, accounts, removeAccount, addInvite } = useAuthStore();
  const { trainerInviteRequests, novaSessions, stopNovaSession } = useAccessStore();
  const { selectors, sessions, assignments, removeSelector } = useTrainerStore();

  const [tab, setTab] = useState<Tab>("Overview");
  const [trainerName, setTrainerName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [preselectedAssignmentId, setPreselectedAssignmentId] = useState<string | null>(null);
  const [confirmSelector, setConfirmSelector] = useState<number | null>(null);
  const [confirmTrainer, setConfirmTrainer] = useState<string | null>(null);

  const openAssignForAssignment = (assignmentId: string) => {
    setPreselectedAssignmentId(assignmentId);
    setShowAssignModal(true);
  };
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
    <div className="min-h-screen bg-slate-950 text-white px-3 py-5 sm:px-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
                <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-slate-950" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-black">{t("supervisor.heading")}</h1>
            </div>
            <p className="text-slate-400 text-sm">{t("supervisor.subtitle")}</p>
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
              <LogOut className="h-4 w-4" /> {t("supervisor.signOut")}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: "Open", value: openCount, icon: Activity },
            { label: "Selectors", value: selectors.length, icon: Users },
            { label: "NOVA Active", value: activeNovaCount, icon: Zap },
            { label: "Sessions", value: sessions.length, icon: BookOpen },
            { label: "Pass rate", value: "0%", icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Icon className="h-4 w-4 text-slate-500" />
                <p className="text-slate-400 text-xs sm:text-sm font-medium">{label}</p>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-white">{value}</p>
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

        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto scroll-x-hidden gap-2 pb-1 -mx-1 px-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 sm:px-5 py-2 text-sm font-bold border transition whitespace-nowrap shrink-0 ${
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
                {s.novaPin && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-2.5 py-1">
                    <KeyRound className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs font-black text-yellow-300 tracking-widest">{s.novaPin}</span>
                  </div>
                )}
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

        {tab === "Assignments" && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {assignments.map((a) => {
              const assignedTo = selectors.find((s) => s.assignedAssignmentId === a.id);
              return (
                <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-black text-white">#{a.assignmentNumber}</p>
                      <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        a.type === "PRODUCTION"
                          ? "bg-orange-500/10 text-orange-300 border-orange-500/30"
                          : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                      }`}>{a.type}</span>
                    </div>
                    {assignedTo ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between"><span>Cases</span><span className="text-white font-bold">{a.totalCases}</span></div>
                    <div className="flex justify-between"><span>Stops</span><span className="text-white font-bold">{a.stops}</span></div>
                    <div className="flex justify-between"><span>Aisles</span><span className="text-white font-bold">{a.startAisle}–{a.endAisle}</span></div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" /> Door</span>
                      <span className="text-yellow-300 font-bold">{a.doorNumber} · {a.doorCode}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3">
                    {assignedTo ? (
                      <p className="text-xs text-green-300 font-semibold capitalize truncate">✓ {assignedTo.name}</p>
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
        )}

        {tab === "Selectors" && (
          <div className="space-y-4">
            {selectors.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-black capitalize">{s.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{s.novaId} · Level: {s.level} · Age {s.age}</p>
                  <p className="text-slate-400 text-sm">{s.experience}</p>
                  {s.novaPin && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-2.5 py-1">
                      <KeyRound className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs font-black text-yellow-300 tracking-widest">NOVA ID: {s.novaPin}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {s.novaActive && <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300 border border-green-500/30">NOVA Active</span>}
                  {s.assignedAssignmentId
                    ? <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">Has Assignment</span>
                    : <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-slate-400 border border-slate-600">Unassigned</span>}
                  {confirmSelector === s.id ? (
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-red-400 font-semibold">Delete training record?</span>
                      <button
                        onClick={() => { removeSelector(s.id); setConfirmSelector(null); }}
                        className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-bold text-white transition"
                      >Yes, delete</button>
                      <button
                        onClick={() => setConfirmSelector(null)}
                        className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300 hover:border-slate-400 transition"
                      >Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmSelector(s.id)}
                      className="ml-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
            {selectors.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">No selectors yet.</div>}
          </div>
        )}

        {tab === "Trainers" && (() => {
          const trainerAccounts = accounts.filter((a) => a.role === "trainer");
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-yellow-400" />
                <p className="text-sm text-slate-400">Supervisors can remove trainer accounts. This cannot be undone.</p>
              </div>
              {trainerAccounts.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">No trainer accounts found.</div>
              )}
              {trainerAccounts.map((a) => (
                <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                      <UserCheck className="h-4 w-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="font-black capitalize">{a.fullName}</p>
                      <p className="text-slate-400 text-sm">@{a.username} · Trainer</p>
                      <p className="text-slate-500 text-xs mt-0.5">Added {formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${
                      a.status === "active"
                        ? "bg-green-500/10 text-green-300 border-green-500/30"
                        : "bg-slate-700 text-slate-400 border-slate-600"
                    }`}>{a.status}</span>
                    {confirmTrainer === a.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400 font-semibold">Remove trainer?</span>
                        <button
                          onClick={() => { removeAccount(a.id); setConfirmTrainer(null); }}
                          className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-bold text-white transition"
                        >Yes, remove</button>
                        <button
                          onClick={() => setConfirmTrainer(null)}
                          className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300 hover:border-slate-400 transition"
                        >Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmTrainer(a.id)}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

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

      <AssignAssignmentModal
        open={showAssignModal}
        onClose={() => { setShowAssignModal(false); setPreselectedAssignmentId(null); }}
        preselectedAssignmentId={preselectedAssignmentId}
      />
    </div>
  );
}
