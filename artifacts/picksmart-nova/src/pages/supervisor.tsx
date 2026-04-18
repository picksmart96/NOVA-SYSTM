import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAccessStore } from "@/lib/accessStore";
import { useTrainerStore } from "@/lib/trainerStore";
import { useAuthStore } from "@/lib/authStore";
import { AssignAssignmentModal } from "@/components/nova/AssignAssignmentModal";
import { useTranslation } from "react-i18next";
import { useSupervisorPostStore } from "@/lib/supervisorPostStore";
import { usePositions } from "@/hooks/usePositions";
import { useAlerts } from "@/hooks/useAlerts";
import {
  Activity, Users, Zap, BookOpen, TrendingUp, Radio,
  MapPin, LogOut, Copy, Send, UserPlus, Check,
  ClipboardList, CheckCircle2, AlertCircle, DoorOpen, KeyRound,
  Trash2, UserCheck, ShieldAlert, Megaphone, Star, X as XIcon,
  Warehouse, Headphones, MessageSquare, RefreshCw, Bell,
} from "lucide-react";

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const TABS = ["Overview", "Assignments", "Activate NOVA", "Selectors", "Trainers", "People", "Sessions", "Shift Post", "Weekly Report", "Live Monitor"] as const;
type Tab = typeof TABS[number];

const MEDALS = ["🥇", "🥈", "🥉", "4.", "5."];
const BASE_URL = import.meta.env.BASE_URL;
const WEEKLY_API = `${BASE_URL}api/social/weekly-reports`;

export default function SupervisorPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { logout, accounts, removeAccount, banUser, unbanUser, currentUser } = useAuthStore();
  const { trainerInviteRequests, novaSessions, stopNovaSession } = useAccessStore();
  const { selectors, sessions, assignments, removeSelector } = useTrainerStore();
  const { posts: supervisorPosts, addPost, deletePost } = useSupervisorPostStore();

  const { positions, sendCoaching, getPositionStatus } = usePositions(5000);
  const { alerts, unreadCount, markRead, markAllRead, createAlert } = useAlerts(10000);

  const [tab, setTab] = useState<Tab>("Overview");
  const [trainerName, setTrainerName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");

  // Shift Post form state
  const [postShiftSummary, setPostShiftSummary] = useState("");
  const [postSafetyTopic, setPostSafetyTopic] = useState("");
  const [postWorkload, setPostWorkload] = useState("");
  const [postTopSelector, setPostTopSelector] = useState("");
  const [postTopRate, setPostTopRate] = useState("");
  const [postMessage, setPostMessage] = useState("");
  const [postSent, setPostSent] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [preselectedAssignmentId, setPreselectedAssignmentId] = useState<string | null>(null);
  const [confirmSelector, setConfirmSelector] = useState<number | null>(null);
  const [confirmTrainer, setConfirmTrainer] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Weekly Report state
  const [wrWarehouseName, setWrWarehouseName] = useState("");
  const [wrCountry, setWrCountry] = useState("");
  const [wrState, setWrState] = useState("");
  const [wrWeek, setWrWeek] = useState(new Date().toISOString().slice(0, 10));
  const [wrSelectors, setWrSelectors] = useState([
    { name: "", cases: "", hours: "", rate: "" },
    { name: "", cases: "", hours: "", rate: "" },
    { name: "", cases: "", hours: "", rate: "" },
    { name: "", cases: "", hours: "", rate: "" },
    { name: "", cases: "", hours: "", rate: "" },
  ]);
  const [wrSubmitting, setWrSubmitting] = useState(false);
  const [wrSubmitted, setWrSubmitted] = useState(false);
  const [wrError, setWrError] = useState("");
  const [coachTarget, setCoachTarget] = useState<string | null>(null);
  const [coachMsg, setCoachMsg] = useState("");
  const [coachSent, setCoachSent] = useState<string | null>(null);
  const [alertFilter, setAlertFilter] = useState<"all" | "high" | "security" | "performance">("all");

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

  const handleSendInvite = async () => {
    if (!trainerName.trim() || !trainerEmail.trim()) return;
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(() => {
            try {
              const raw = localStorage.getItem("picksmart-auth-store");
              const jwt = raw ? (JSON.parse(raw) as { state?: { jwtToken?: string } })?.state?.jwtToken : null;
              return jwt ? { Authorization: `Bearer ${jwt}` } : {};
            } catch { return {}; }
          })(),
        },
        body: JSON.stringify({
          fullName: trainerName.trim(),
          email: trainerEmail.trim(),
          role: "trainer",
          warehouseId: currentUser?.warehouseId ?? null,
          warehouseSlug: currentUser?.warehouseSlug ?? null,
        }),
      });
      if (!res.ok) return;
      const { inviteUrl } = await res.json() as { token: string; inviteUrl: string };
      setInviteToken(inviteUrl);
      setTrainerName("");
      setTrainerEmail("");
    } catch { /* silent — user can retry */ }
  };

  const generatedInviteUrl = inviteToken ?? null;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1800);
    } catch { /* silent */ }
  };

  const activeNovaCount = selectors.filter((s) => s.novaActive).length;
  const openCount = selectors.filter((s) => s.assignedAssignmentId).length;

  async function submitWeeklyReport() {
    if (!wrWarehouseName.trim() || !wrWeek) return;
    const filled = wrSelectors.filter(s => s.name.trim());
    if (filled.length === 0) { setWrError("Add at least one selector name."); return; }
    setWrError("");
    setWrSubmitting(true);
    try {
      const res = await fetch(WEEKLY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseName: wrWarehouseName.trim(),
          warehouseCountry: wrCountry.trim(),
          warehouseState: wrState.trim(),
          week: wrWeek,
          submittedByName: currentUser?.fullName || "Supervisor",
          selectors: filled.map(s => ({
            name: s.name.trim(),
            cases: parseInt(s.cases) || 0,
            hours: parseFloat(s.hours) || 0,
            rate: parseFloat(s.rate) || 0,
          })),
        }),
      });
      if (res.ok) {
        setWrSubmitted(true);
        setWrWarehouseName(""); setWrCountry(""); setWrState("");
        setWrSelectors(wrSelectors.map(() => ({ name: "", cases: "", hours: "", rate: "" })));
        setTimeout(() => setWrSubmitted(false), 5000);
      } else {
        setWrError("Failed to submit. Please try again.");
      }
    } catch {
      setWrError("Network error. Please try again.");
    }
    setWrSubmitting(false);
  }

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
            <Link href="/warehouse-setup">
              <button className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 px-5 py-3 font-semibold hover:border-yellow-400 hover:bg-yellow-400/10 transition flex items-center gap-2 text-yellow-300">
                <Warehouse className="h-4 w-4" /> Warehouse Setup
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
        {tab === "Overview" && (() => {
          const trainerAccounts = accounts.filter((a) => a.role === "trainer");
          return (
            <div className="space-y-6">
              {/* Trainers management */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-400" /> Trainers
                </h2>
                {trainerAccounts.length === 0 ? (
                  <p className="text-slate-500 text-sm">No trainer accounts yet.</p>
                ) : (
                  <div className="space-y-3">
                    {trainerAccounts.map((a) => (
                      <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                            <UserCheck className="h-3.5 w-3.5 text-blue-300" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm capitalize truncate">{a.fullName}</p>
                            <p className="text-xs text-slate-500">@{a.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${a.status === "active" ? "bg-green-500/10 text-green-300 border-green-500/30" : "bg-slate-700 text-slate-400 border-slate-600"}`}>{a.status}</span>
                          {confirmTrainer === a.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-400 font-semibold">Remove?</span>
                              <button onClick={() => { removeAccount(a.id); setConfirmTrainer(null); }} className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-bold text-white transition">Yes</button>
                              <button onClick={() => setConfirmTrainer(null)} className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300 hover:border-slate-400 transition">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmTrainer(a.id)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition flex items-center gap-1">
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Training records management */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-yellow-400" /> Training Records
                </h2>
                {selectors.length === 0 ? (
                  <p className="text-slate-500 text-sm">No training records yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectors.map((s) => (
                      <div key={s.id} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm capitalize truncate">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.novaId} · {s.level}{s.novaActive ? " · NOVA Active" : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {confirmSelector === s.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-400 font-semibold">Delete?</span>
                              <button onClick={() => { removeSelector(s.id); setConfirmSelector(null); }} className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-bold text-white transition">Yes</button>
                              <button onClick={() => setConfirmSelector(null)} className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300 hover:border-slate-400 transition">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmSelector(s.id)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition flex items-center gap-1">
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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

        {/* ── People tab — delete selector + trainer accounts ──────────────── */}
        {tab === "People" && (() => {
          // Supervisors can only delete selector and trainer accounts
          const deletable = accounts.filter(
            (a) => a.role === "selector" || a.role === "trainer"
          );
          const protected_ = accounts.filter(
            (a) => a.role === "supervisor" || a.role === "manager" ||
                   a.role === "director" || a.role === "owner"
          );

          const roleColor: Record<string, string> = {
            selector: "text-slate-300",
            trainer:  "text-cyan-400",
          };
          const roleBg: Record<string, string> = {
            selector: "bg-slate-700/50 border-slate-600",
            trainer:  "bg-cyan-500/10 border-cyan-500/30",
          };

          return (
            <div className="space-y-6">
              {/* Info banner */}
              <div className="flex items-start gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">
                <ShieldAlert className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-300">Supervisor Account Management</p>
                  <p className="text-xs text-slate-400 mt-1">
                    You can remove <span className="text-white font-bold">selector</span> and <span className="text-white font-bold">trainer</span> accounts.
                    Manager, director, and owner accounts are protected and cannot be removed from here.
                  </p>
                </div>
              </div>

              {/* Deletable accounts */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                  Selector &amp; Trainer Accounts ({deletable.length})
                </p>
                {deletable.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
                    No selector or trainer accounts found.
                  </div>
                )}
                <div className="space-y-3">
                  {deletable.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 font-black text-white text-sm">
                          {a.fullName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-white">{a.fullName}</p>
                          <p className="text-xs text-slate-500">@{a.username}</p>
                          {a.accountNumber && (
                            <span className="inline-block mt-0.5 rounded-md border border-slate-700 px-1.5 py-0.5 text-[10px] font-black text-yellow-400 tracking-widest">
                              {a.accountNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Role badge */}
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold border capitalize ${roleBg[a.role] ?? ""} ${roleColor[a.role] ?? ""}`}>
                          {a.role}
                        </span>

                        {/* Status badge */}
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${
                          a.status === "active"
                            ? "bg-green-500/10 text-green-300 border-green-500/30"
                            : "bg-red-500/10 text-red-300 border-red-500/30"
                        }`}>
                          {a.status}
                        </span>

                        {/* Ban / Unban */}
                        {a.status === "banned" ? (
                          <button
                            onClick={() => unbanUser(a.id)}
                            className="rounded-lg border border-green-500/30 px-3 py-1.5 text-xs font-bold text-green-300 hover:bg-green-500/10 transition"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => banUser(a.id)}
                            className="rounded-lg border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500/10 transition"
                          >
                            Ban
                          </button>
                        )}

                        {/* Delete with confirmation */}
                        {confirmDelete === a.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-400 font-semibold">Remove account?</span>
                            <button
                              onClick={() => { removeAccount(a.id); setConfirmDelete(null); }}
                              className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-bold text-white transition"
                            >
                              Yes, remove
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300 hover:border-slate-400 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(a.id)}
                            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protected accounts — shown but locked */}
              {protected_.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
                    Protected Accounts — Cannot Be Removed
                  </p>
                  <div className="space-y-2">
                    {protected_.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4 flex flex-wrap items-center justify-between gap-4 opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 font-black text-slate-500 text-sm">
                            {a.fullName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-400">{a.fullName}</p>
                            <p className="text-xs text-slate-600 capitalize">@{a.username} · {a.role}</p>
                          </div>
                        </div>
                        <span className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600">
                          🔒 Protected
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

        {tab === "Shift Post" && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-yellow-400" />
                Post Today's Shift Briefing
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Selectors will hear this update when they tap "🎧 Ask NOVA" on their portal.
              </p>
            </div>

            {/* Form */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Shift Summary</label>
                  <textarea
                    value={postShiftSummary}
                    onChange={(e) => setPostShiftSummary(e.target.value)}
                    placeholder="e.g. Big volume day, 480 slots assigned. Stay focused."
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Safety Topic</label>
                  <textarea
                    value={postSafetyTopic}
                    onChange={(e) => setPostSafetyTopic(e.target.value)}
                    placeholder="e.g. Watch your step at dock doors 12–15 — floor is wet."
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Workload Update</label>
                  <input
                    value={postWorkload}
                    onChange={(e) => setPostWorkload(e.target.value)}
                    placeholder="e.g. Freezer section is heavy — plan extra time."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Message to Selectors</label>
                  <input
                    value={postMessage}
                    onChange={(e) => setPostMessage(e.target.value)}
                    placeholder="e.g. Let's hit 100% accuracy today. You've got this."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>
              </div>

              {/* Top selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Top Selector (optional)</label>
                <div className="flex gap-3">
                  <input
                    value={postTopSelector}
                    onChange={(e) => setPostTopSelector(e.target.value)}
                    placeholder="Name"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                  <input
                    value={postTopRate}
                    onChange={(e) => setPostTopRate(e.target.value)}
                    placeholder="Rate (e.g. 118%)"
                    className="w-40 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>
              </div>

              <button
                disabled={!postShiftSummary.trim() && !postSafetyTopic.trim() && !postMessage.trim()}
                onClick={() => {
                  addPost({
                    postedBy: currentUser?.fullName ?? "Supervisor",
                    shiftSummary: postShiftSummary.trim(),
                    safetyTopic: postSafetyTopic.trim(),
                    workloadUpdate: postWorkload.trim(),
                    topSelectorName: postTopSelector.trim(),
                    topSelectorRate: postTopRate.trim(),
                    selectorMessage: postMessage.trim(),
                  });
                  setPostShiftSummary(""); setPostSafetyTopic(""); setPostWorkload("");
                  setPostTopSelector(""); setPostTopRate(""); setPostMessage("");
                  setPostSent(true);
                  setTimeout(() => setPostSent(false), 3000);
                }}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-black transition ${
                  postSent
                    ? "bg-green-500 text-white"
                    : "bg-yellow-400 text-slate-950 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {postSent ? (
                  <><CheckCircle2 className="h-4 w-4" /> Briefing posted! Selectors will hear it now.</>
                ) : (
                  <><Send className="h-4 w-4" /> Post Briefing</>
                )}
              </button>
            </div>

            {/* Post history */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-300">Posted Briefings</h3>
              {supervisorPosts.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
                  <Megaphone className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  No briefings posted yet.
                </div>
              )}
              {supervisorPosts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-500">{formatDate(post.createdAt)} · by {post.postedBy}</p>
                      {post.shiftSummary && (
                        <p className="text-white font-semibold text-sm mt-1">{post.shiftSummary}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { if (confirm("Delete this briefing?")) deletePost(post.id); }}
                      className="text-slate-600 hover:text-red-400 transition p-1 shrink-0"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {post.safetyTopic && (
                      <span className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-red-300">
                        🦺 {post.safetyTopic}
                      </span>
                    )}
                    {post.workloadUpdate && (
                      <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-blue-300">
                        ⚡ {post.workloadUpdate}
                      </span>
                    )}
                    {post.topSelectorName && (
                      <span className="rounded-lg bg-yellow-500/10 border border-yellow-400/20 px-2.5 py-1 text-yellow-300">
                        ⭐ {post.topSelectorName} {post.topSelectorRate}
                      </span>
                    )}
                    {post.selectorMessage && (
                      <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-300">
                        💬 {post.selectorMessage}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Weekly Report" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400" />
                Submit Weekly Top 5 Selectors
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Report your warehouse's top 5 selectors for the week. Your report will be sent to the Owner Control Center for review and global publishing.
              </p>
            </div>

            {wrSubmitted && (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-green-300 font-bold flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Report submitted successfully! The owner will review and publish it globally.
              </div>
            )}

            {wrError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-semibold">
                {wrError}
              </div>
            )}

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5">
              {/* Warehouse info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Warehouse Name *</label>
                  <input
                    value={wrWarehouseName}
                    onChange={e => setWrWarehouseName(e.target.value)}
                    placeholder="e.g. ABC Distribution — Warehouse A"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Week *</label>
                  <input
                    type="date"
                    value={wrWeek}
                    onChange={e => setWrWeek(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Country</label>
                  <input
                    value={wrCountry}
                    onChange={e => setWrCountry(e.target.value)}
                    placeholder="e.g. United States"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">State / Province</label>
                  <input
                    value={wrState}
                    onChange={e => setWrState(e.target.value)}
                    placeholder="e.g. California"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>
              </div>

              {/* Top 5 selectors */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Top 5 Selectors</p>
                <div className="space-y-3">
                  {wrSelectors.map((s, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                      <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                        <span className="text-lg font-black w-6 shrink-0">{MEDALS[i]}</span>
                        <input
                          value={s.name}
                          onChange={e => setWrSelectors(sel => sel.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                          placeholder="Selector name"
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                        />
                      </div>
                      <input
                        value={s.cases}
                        onChange={e => setWrSelectors(sel => sel.map((x, j) => j === i ? { ...x, cases: e.target.value } : x))}
                        placeholder="Cases picked"
                        type="number"
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                      />
                      <input
                        value={s.hours}
                        onChange={e => setWrSelectors(sel => sel.map((x, j) => j === i ? { ...x, hours: e.target.value } : x))}
                        placeholder="Hours worked"
                        type="number" step="0.5"
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                      />
                      <input
                        value={s.rate}
                        onChange={e => setWrSelectors(sel => sel.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))}
                        placeholder="Rate %"
                        type="number" step="0.1"
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-2">Columns: Name · Cases Picked · Hours Worked · Rate %</p>
              </div>

              <button
                onClick={submitWeeklyReport}
                disabled={wrSubmitting || !wrWarehouseName.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {wrSubmitting ? (
                  <><div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> Submitting…</>
                ) : (
                  <><Send className="h-4 w-4" /> Send Report to Owner</>
                )}
              </button>
            </div>
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

        {tab === "Live Monitor" && (
          <div className="space-y-6">

            {/* ── Alerts Panel ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-400" />
                  <h2 className="font-black text-lg">NOVA Alerts</h2>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unreadCount} new</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={alertFilter}
                    onChange={e => setAlertFilter(e.target.value as typeof alertFilter)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                  >
                    <option value="all">All</option>
                    <option value="high">High Severity</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                  </select>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:text-white hover:border-yellow-400 transition"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => createAlert("performance", "Test alert from supervisor", "medium")}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:text-white hover:border-yellow-400 transition"
                  >
                    + Test Alert
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {alerts
                  .filter(a => alertFilter === "all" || (alertFilter === "high" ? a.severity === "high" : a.type === alertFilter))
                  .slice(0, 30)
                  .map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => markRead(alert.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                        !alert.read ? "border-yellow-500/40 bg-yellow-500/5" : "border-slate-800 bg-slate-900"
                      }`}
                    >
                      <div className={`mt-0.5 rounded-full w-2 h-2 shrink-0 ${
                        alert.severity === "high" ? "bg-red-400" :
                        alert.severity === "medium" ? "bg-yellow-400" : "bg-blue-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold uppercase ${
                            alert.severity === "high" ? "text-red-400" :
                            alert.severity === "medium" ? "text-yellow-400" : "text-blue-400"
                          }`}>{alert.type} · {alert.severity}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(alert.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                {alerts.length === 0 && (
                  <p className="text-center py-6 text-slate-500 text-sm">No alerts — all clear ✓</p>
                )}
              </div>
            </div>

            {/* ── Live Selector Positions ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-yellow-400" />
                  <h2 className="font-black text-lg">Live Selector Monitor</h2>
                  <span className="text-xs text-slate-500">updates every 5s</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-green-400" /> Active
                    <div className="h-2 w-2 rounded-full bg-yellow-400 ml-2" /> Moving
                    <div className="h-2 w-2 rounded-full bg-red-400 ml-2" /> Delayed
                  </div>
                </div>
              </div>

              {positions.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900 py-12 text-center">
                  <MapPin className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-semibold">No active selectors</p>
                  <p className="text-slate-600 text-sm mt-1">Position data appears when selectors check in via NOVA</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {positions.map(pos => {
                    const liveStatus = getPositionStatus(pos.updatedAt);
                    const statusColor = liveStatus === "active" ? "bg-green-500/10 border-green-500/30 text-green-300"
                      : liveStatus === "moving" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300";
                    const dotColor = liveStatus === "active" ? "bg-green-400" : liveStatus === "moving" ? "bg-yellow-400" : "bg-red-400";
                    const isCoaching = coachTarget === pos.selectorId;
                    return (
                      <div key={pos.selectorId} className={`rounded-xl border p-4 ${statusColor}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                            <span className="font-bold text-sm text-white">{pos.selectorName ?? "Selector"}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border ${statusColor}`}>{liveStatus}</span>
                        </div>
                        <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                          {pos.currentAisle && (
                            <p>📍 Aisle <span className="text-white font-bold">{pos.currentAisle}</span>
                              {pos.currentSlot && <> · Slot <span className="text-white font-bold">{pos.currentSlot}</span></>}
                            </p>
                          )}
                          {pos.nextAisle && (
                            <p>➡️ Next: Aisle <span className="text-white font-bold">{pos.nextAisle}</span>
                              {pos.nextSlot && <> · Slot <span className="text-white font-bold">{pos.nextSlot}</span></>}
                            </p>
                          )}
                          <p className="text-slate-600 text-[10px]">Updated {new Date(pos.updatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setCoachTarget(isCoaching ? null : pos.selectorId); setCoachMsg(""); setCoachSent(null); }}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:border-yellow-400 hover:text-yellow-300 transition"
                          >
                            <Headphones className="h-3 w-3" /> Coach
                          </button>
                          {liveStatus === "delayed" && (
                            <button
                              onClick={async () => {
                                await createAlert("performance", `Supervisor intervention needed: ${pos.selectorName ?? "Selector"} delayed at Aisle ${pos.currentAisle}`, "high");
                              }}
                              className="flex items-center gap-1 rounded-lg border border-red-500/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10 transition"
                            >
                              <ShieldAlert className="h-3 w-3" /> Alert
                            </button>
                          )}
                        </div>
                        {isCoaching && (
                          <div className="mt-3 space-y-2">
                            <textarea
                              value={coachMsg}
                              onChange={e => setCoachMsg(e.target.value)}
                              placeholder="Coaching message (will be spoken aloud to selector)..."
                              rows={2}
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-yellow-400"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!coachMsg.trim()) return;
                                  const ok = await sendCoaching(pos.selectorId, coachMsg.trim());
                                  if (ok) { setCoachSent(pos.selectorId); setCoachMsg(""); setTimeout(() => setCoachSent(null), 3000); }
                                }}
                                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-yellow-300 transition"
                              >
                                <Send className="h-3 w-3" /> Send
                              </button>
                              <button onClick={() => setCoachTarget(null)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-500 transition">
                                Cancel
                              </button>
                            </div>
                            {coachSent === pos.selectorId && (
                              <p className="text-xs text-green-400 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Coaching message sent!</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      <AssignAssignmentModal
        open={showAssignModal}
        onClose={() => { setShowAssignModal(false); setPreselectedAssignmentId(null); }}
        preselectedAssignmentId={preselectedAssignmentId}
      />
    </div>
  );
}
