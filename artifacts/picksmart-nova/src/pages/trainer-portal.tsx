import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useTrainerStore } from "@/lib/trainerStore";
import { useAuthStore } from "@/lib/authStore";
import { useTranslation } from "react-i18next";
import { ActivateNovaModal } from "@/components/nova/ActivateNovaModal";
import { LogSessionModal } from "@/components/nova/LogSessionModal";
import { SessionCard } from "@/components/nova/SessionCard";
import {
  Shield, Users, BookOpen,
  Zap, MapPin, UserPlus, LogOut, KeyRound, Copy, Check, Mail, Send,
  ClipboardList, Plus, HelpCircle, CheckCircle2, RefreshCw, ChevronRight,
} from "lucide-react";
import MistakeLogPanel from "@/components/nova/MistakeLogPanel";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type SelectorLevel = "Beginner" | "Intermediate" | "Advanced";

export default function TrainerPortalPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { currentUser, logout, jwtToken } = useAuthStore();
  const {
    trainer, selectors, sessions,
    addSelector, toggleNova,
  } = useTrainerStore();

  const handleSignOut = () => { logout(); navigate("/login"); };

  const [showNovaModal,  setShowNovaModal]  = useState(false);
  const [showLogModal,   setShowLogModal]   = useState(false);
  const [preselectedSelectorId, setPreselectedSelectorId] = useState<number | null>(null);

  // Register selector form
  const [form, setForm] = useState({
    fullName: "", email: "", age: "", level: "Beginner" as SelectorLevel, notes: "",
  });
  const [inviteLink,   setInviteLink]   = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Request help state
  const [showHelpModal,  setShowHelpModal]  = useState(false);
  const [helpNote,       setHelpNote]       = useState("");
  const [helpSending,    setHelpSending]    = useState(false);
  const [helpSent,       setHelpSent]       = useState(false);
  const [helpErr,        setHelpErr]        = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) return;
    addSelector({
      name: form.fullName,
      email: form.email,
      age: Number(form.age) || 20,
      level: form.level,
      notes: form.notes,
    });
    try {
      const res = await fetch(`${BASE}/api/auth/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email:    form.email.trim(),
          role: "selector",
          warehouseId:   currentUser?.warehouseId   ?? null,
          warehouseSlug: currentUser?.warehouseSlug ?? null,
        }),
      });
      if (res.ok) {
        const { token } = await res.json() as { token: string };
        setInviteLink(`${window.location.origin}${BASE}/invite?token=${token}`);
      }
    } catch { /* silent */ }
    setForm({ fullName: "", email: "", age: "", level: "Beginner", notes: "" });
  };

  const handleCopyInvite = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const openNovaFor = (id: number) => { setPreselectedSelectorId(id); setShowNovaModal(true); };
  const openLogFor  = (id: number) => { setPreselectedSelectorId(id); setShowLogModal(true);  };

  const novaActiveCount = selectors.filter(s => s.novaActive).length;

  async function sendHelpRequest() {
    if (!helpNote.trim()) { setHelpErr("Describe what you need help with."); return; }
    setHelpSending(true); setHelpErr("");
    try {
      await fetch(`${BASE}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({
          type: "help_request",
          message: `Assignment help requested by ${currentUser?.fullName ?? currentUser?.username ?? "a trainer"}`,
          severity: "medium",
          meta: {
            note: helpNote.trim(),
            requestedBy: {
              id:          currentUser?.id,
              username:    currentUser?.username,
              fullName:    currentUser?.fullName,
              companyName: currentUser?.companyName,
            },
          },
        }),
      });
      setHelpSent(true);
      setHelpNote("");
      setTimeout(() => { setHelpSent(false); setShowHelpModal(false); }, 3000);
    } catch {
      setHelpErr("Failed to send. Please try again.");
    } finally { setHelpSending(false); }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-3 py-5 sm:px-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-slate-950" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-black">{t("trainerPortal.heading")}</h1>
            </div>
            <p className="text-slate-400 text-sm capitalize">
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
              <LogOut className="h-4 w-4" /> {t("trainerPortal.signOut")}
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Users className="h-4 w-4 text-slate-500" />
              <p className="text-slate-400 text-xs sm:text-sm font-medium">My Selectors</p>
            </div>
            <p className="text-3xl sm:text-5xl font-black text-white">{selectors.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Sessions</p>
            </div>
            <p className="text-3xl sm:text-5xl font-black text-white">{sessions.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Zap className="h-4 w-4 text-slate-500" />
              <p className="text-slate-400 text-xs sm:text-sm font-medium">NOVA Active</p>
            </div>
            <p className="text-3xl sm:text-5xl font-black text-white">{novaActiveCount}</p>
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
        </div>

        {/* ── Main two-column layout ── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Register Selector */}
          <div id="register-form" className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-yellow-400" /> Register Selector
            </h2>

            {inviteLink && (
              <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-300 font-black text-sm uppercase tracking-widest">
                  <Send className="h-4 w-4" /> Selector registered — invite link ready
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-xs text-slate-300 break-all">
                  {inviteLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className={`rounded-2xl px-4 py-2 text-sm font-black flex items-center gap-2 transition ${
                    copiedInvite ? "bg-green-500/20 text-green-300" : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  {copiedInvite ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy invite link</>}
                </button>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Full name</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="selector@example.com"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Age</label>
                  <input
                    value={form.age}
                    onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                    type="number" min="16" max="70"
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
                disabled={!form.fullName.trim() || !form.email.trim()}
                className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <UserPlus className="h-4 w-4" /> Register selector &amp; generate invite
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
                {selectors.map((selector) => (
                  <div key={selector.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
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
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                      <button
                        onClick={() => openNovaFor(selector.id)}
                        className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-yellow-400 hover:text-yellow-400 transition flex items-center gap-1"
                      >
                        <Zap className="h-3 w-3" />
                        {selector.novaActive ? "Deactivate" : "Activate"} NOVA
                      </button>
                      <button
                        onClick={() => openLogFor(selector.id)}
                        className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-yellow-400 hover:text-yellow-400 transition flex items-center gap-1"
                      >
                        <BookOpen className="h-3 w-3" /> Log Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Training Assignments ── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-yellow-400" /> Training Assignments
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Build from scratch */}
            <Link href="/assignment-builder">
              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10 p-6 flex flex-col gap-3 cursor-pointer transition group">
                <div className="w-12 h-12 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-base font-black text-white group-hover:text-yellow-300 transition">Build from Scratch</p>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    Create your own training assignment — add stops manually, upload a CSV, or auto-generate random picks.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold mt-auto">
                  Open Builder <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            {/* Request help */}
            <div
              onClick={() => { setShowHelpModal(true); setHelpSent(false); setHelpErr(""); }}
              className="rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 p-6 flex flex-col gap-3 cursor-pointer transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-base font-black text-white group-hover:text-blue-300 transition">Request Help</p>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Not sure how to set it up? Send a request and the PickSmart team will build your assignment for you.
                </p>
              </div>
              <div className="flex items-center gap-1 text-blue-400 text-sm font-bold mt-auto">
                Send Request <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Mistake Log Panel ── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <MistakeLogPanel />
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
      <ActivateNovaModal
        open={showNovaModal}
        onClose={() => { setShowNovaModal(false); setPreselectedSelectorId(null); }}
      />
      <LogSessionModal
        open={showLogModal}
        onClose={() => { setShowLogModal(false); setPreselectedSelectorId(null); }}
        preselectedSelectorId={preselectedSelectorId}
      />

      {/* ── Request Help Modal ── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-black text-white text-base">Request Assignment Help</p>
                <p className="text-xs text-slate-500">The PickSmart team will build it for you</p>
              </div>
            </div>

            {helpSent ? (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-6 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto" />
                <p className="text-green-300 font-black">Request sent!</p>
                <p className="text-slate-400 text-sm">We'll be in touch to help build your assignment.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Describe what you need
                  </label>
                  <textarea
                    value={helpNote}
                    onChange={e => { setHelpNote(e.target.value); setHelpErr(""); }}
                    rows={4}
                    placeholder="e.g. 30-stop training run from aisles 10–25, mixed qty 1–6 cases, 3-digit check codes..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400 transition resize-none placeholder:text-slate-600 text-sm"
                  />
                  {helpErr && <p className="text-xs text-red-400 mt-1">{helpErr}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="flex-1 rounded-2xl border border-slate-700 text-slate-400 py-3 text-sm font-bold hover:border-slate-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendHelpRequest}
                    disabled={helpSending || !helpNote.trim()}
                    className="flex-1 rounded-2xl bg-blue-500 text-white font-black py-3 text-sm hover:bg-blue-400 transition disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {helpSending
                      ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
                      : <><Send className="h-4 w-4" /> Send Request</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
