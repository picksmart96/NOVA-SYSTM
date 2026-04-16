import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Mic, Shield, UserPlus,
  Check, Copy, Send, Zap, HelpCircle,
  ClipboardList, Warehouse, LogOut, ChevronRight,
  Mail, Building2, User, RefreshCw, Clock,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  PlayCircle, Activity, FileText,
  Plus, Upload, Shuffle, ChevronDown, Trash2,
  MessageSquare, Wrench,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const APP_URL = `${window.location.origin}${BASE}`;

// ─── Nav cards ───────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Management",
    items: [
      { label: "Trainer Portal",    path: "/trainer-portal",      icon: LayoutDashboard, desc: "Manage selectors & sessions",       color: "yellow" },
      { label: "Supervisor",        path: "/supervisor",           icon: Shield,          desc: "Shift overview & metrics",          color: "green"  },
      { label: "Manager",           path: "/manager",              icon: Users,           desc: "Team performance & training status", color: "blue"   },
      { label: "Owner Dashboard",   path: "/owner",                icon: Users,           desc: "Accounts, billing & settings",      color: "blue"   },
    ],
  },
  {
    label: "NOVA Voice",
    items: [
      { label: "NOVA Selector",  path: "/selector",       icon: Mic,         desc: "Live NOVA picking session",    color: "purple" },
      { label: "NOVA Trainer",   path: "/nova-trainer",   icon: Zap,         desc: "Voice-directed trainer mode", color: "purple" },
      { label: "NOVA Help",      path: "/nova-help",      icon: HelpCircle,  desc: "AI voice coach & analytics",  color: "purple" },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Warehouse Setup", path: "/warehouse-setup", icon: Warehouse, desc: "Configure zones & locations", color: "orange" },
    ],
  },
  {
    label: "Owner Only",
    items: [
      { label: "Control Panel",      path: "/control-panel",      icon: Shield,    desc: "Director accounts, invite links & performance",      color: "green"  },
      { label: "Platform Overview",  path: "/platform-overview",  icon: FileText,  desc: "Full platform docs — pages, roles, tech, credentials", color: "yellow" },
    ],
  },
];

const COLOR: Record<string, { border: string; icon: string; text: string; hover: string }> = {
  yellow: { border: "border-yellow-400/20", icon: "bg-yellow-400/10 text-yellow-400", text: "text-yellow-400", hover: "hover:border-yellow-400/50 hover:bg-yellow-400/5" },
  green:  { border: "border-green-500/20",  icon: "bg-green-500/10 text-green-400",   text: "text-green-400",  hover: "hover:border-green-500/50 hover:bg-green-500/5"  },
  blue:   { border: "border-blue-500/20",   icon: "bg-blue-500/10 text-blue-400",     text: "text-blue-400",   hover: "hover:border-blue-500/50 hover:bg-blue-500/5"   },
  purple: { border: "border-purple-500/20", icon: "bg-purple-500/10 text-purple-400", text: "text-purple-400", hover: "hover:border-purple-500/50 hover:bg-purple-500/5"},
  orange: { border: "border-orange-500/20", icon: "bg-orange-500/10 text-orange-400", text: "text-orange-400", hover: "hover:border-orange-500/50 hover:bg-orange-500/5"},
};

// ─── Quick Invite ─────────────────────────────────────────────────────────────
function QuickInvite() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [role,     setRole]     = useState("selector");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [url,      setUrl]      = useState("");
  const [copied,   setCopied]   = useState(false);
  const [err,      setErr]      = useState("");

  async function generate() {
    if (!name || !email) { setErr("Name and email are required."); return; }
    setErr("");
    setSending(true);
    try {
      const res = await fetch(`${BASE}/api/auth/invite`, {
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
        body: JSON.stringify({ fullName: name, email, role }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error ?? "Failed to create invite."); return; }
      const data = await res.json();
      setUrl(`${APP_URL}/invite/${data.token as string}`);
      setSent(false);
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function sendEmail() {
    if (!url) return;
    setSending(true); setErr("");
    try {
      const r = await fetch(`${BASE}/api/invites/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, inviteUrl: url }),
      });
      if (r.ok) { setSent(true); }
      else {
        const d = await r.json().catch(() => ({}));
        setErr(d.error ?? "Send failed — link copied instead.");
        navigator.clipboard.writeText(url).catch(() => {});
      }
    } catch {
      setErr("Network error — link copied.");
      navigator.clipboard.writeText(url).catch(() => {});
    } finally { setSending(false); }
  }

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <h2 className="text-base font-black text-white flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-yellow-400" /> Invite Team Member
      </h2>

      <div className="space-y-3">
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
        />
        <input
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email address" type="email"
          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
        />
        <select
          value={role} onChange={e => setRole(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
        >
          <option value="selector">Selector</option>
          <option value="trainer">Trainer</option>
          <option value="supervisor">Supervisor</option>
          <option value="owner">Owner</option>
        </select>
      </div>

      <button
        onClick={generate}
        disabled={!name || !email}
        className="w-full rounded-xl bg-yellow-400 text-slate-950 font-black py-2.5 text-sm hover:bg-yellow-300 transition disabled:opacity-40"
      >
        Generate Invite Link
      </button>

      {url && (
        <div className="space-y-3 pt-1">
          <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-400 break-all font-mono leading-relaxed">
            {url}
          </div>
          <div className="flex gap-2">
            <button
              onClick={sendEmail} disabled={sending}
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending
                ? <span className="animate-spin h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                : sent
                ? <><Check className="h-4 w-4 text-green-400" /> Sent!</>
                : <><Send className="h-4 w-4" /> Send Email</>}
            </button>
            <button
              onClick={copy}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:border-yellow-400 px-4 py-2.5 text-sm font-bold text-white transition flex items-center gap-2"
            >
              {copied ? <><Check className="h-4 w-4 text-green-400" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
            </button>
          </div>
          {err  && <p className="text-xs text-red-400">{err}</p>}
          {sent && <p className="text-xs text-green-400">✓ Invite sent to {email}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Trial Signups Panel ──────────────────────────────────────────────────────
interface TrialSignup {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  companyName: string | null;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  status: string;
}

function daysLeft(endsAt: string | null): number {
  if (!endsAt) return 0;
  return Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function TrialSignups() {
  const jwtToken = useAuthStore((s) => s.jwtToken);
  const [signups,   setSignups]   = useState<TrialSignup[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState("");
  const [sending,   setSending]   = useState<string | null>(null);
  const [sentMap,   setSentMap]   = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${BASE}/api/trial/signups`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!r.ok) throw new Error("Failed to fetch");
      const d = await r.json() as { signups: TrialSignup[] };
      setSignups(d.signups);
    } catch {
      setErr("Could not load trial signups.");
    } finally { setLoading(false); }
  }, [jwtToken]);

  useEffect(() => { load(); }, [load]);

  async function sendUpgrade(s: TrialSignup) {
    if (!s.email) return;
    setSending(s.id);
    try {
      await fetch(`${BASE}/api/trial/send-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({
          companyName: s.companyName ?? s.username,
          contactName: s.fullName,
          email: s.email,
        }),
      });
      setSentMap(m => ({ ...m, [s.id]: true }));
      setTimeout(() => setSentMap(m => { const n = { ...m }; delete n[s.id]; return n; }), 3000);
    } finally { setSending(null); }
  }

  const active    = signups.filter(s => !s.isSubscribed && daysLeft(s.trialEndsAt) > 0);
  const expiring  = active.filter(s => daysLeft(s.trialEndsAt) <= 5);
  const expired   = signups.filter(s => !s.isSubscribed && daysLeft(s.trialEndsAt) <= 0);
  const converted = signups.filter(s => s.isSubscribed && s.trialEndsAt);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-yellow-400" /> Trial Signups
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="text-slate-500 hover:text-white transition"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Active",    count: active.length,    color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
          { label: "Expiring",  count: expiring.length,  color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
          { label: "Converted", count: converted.length, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
        ].map(p => (
          <div key={p.label} className={`rounded-xl border px-3 py-2 ${p.bg}`}>
            <p className={`text-xl font-black ${p.color}`}>{p.count}</p>
            <p className="text-xs text-slate-500">{p.label}</p>
          </div>
        ))}
      </div>

      {err && <p className="text-xs text-red-400">{err}</p>}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : signups.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          No trial signups yet. Send a trial link to get started.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {signups.map(s => {
            const days    = daysLeft(s.trialEndsAt);
            const isConv  = s.isSubscribed;
            const isExp   = !isConv && days <= 0;
            const isUrgent = !isConv && !isExp && days <= 5;

            let statusIcon = <Clock className="h-3.5 w-3.5 text-green-400" />;
            let statusText = `${days}d left`;
            let statusCls  = "text-green-400";
            if (isConv)   { statusIcon = <CheckCircle2 className="h-3.5 w-3.5 text-yellow-400" />; statusText = "Subscribed"; statusCls = "text-yellow-400"; }
            else if (isExp) { statusIcon = <XCircle className="h-3.5 w-3.5 text-red-400" />; statusText = "Expired"; statusCls = "text-red-400"; }
            else if (isUrgent) { statusIcon = <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />; statusText = `${days}d left`; statusCls = "text-orange-400"; }

            return (
              <div
                key={s.id}
                className={`rounded-xl border p-3 flex items-center gap-3 transition ${
                  isConv   ? "border-yellow-400/20 bg-yellow-400/5" :
                  isExp    ? "border-slate-800 bg-slate-950/50 opacity-60" :
                  isUrgent ? "border-orange-500/20 bg-orange-500/5" :
                             "border-slate-800 bg-slate-950/30"
                }`}
              >
                {/* Avatar */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                  isConv ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}>
                  {(s.companyName ?? s.fullName ?? "?")[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {s.companyName ?? s.fullName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{s.email ?? s.username}</p>
                </div>

                {/* Status */}
                <div className={`flex items-center gap-1 text-xs font-bold shrink-0 ${statusCls}`}>
                  {statusIcon} {statusText}
                </div>

                {/* Action */}
                {!isConv && s.email && (
                  <button
                    onClick={() => sendUpgrade(s)}
                    disabled={sending === s.id}
                    title={isExp ? "Re-send trial link" : "Send upgrade nudge"}
                    className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 hover:border-yellow-400 hover:text-yellow-400 text-slate-400 p-1.5 transition"
                  >
                    {sentMap[s.id]
                      ? <Check className="h-3.5 w-3.5 text-green-400" />
                      : sending === s.id
                      ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5" />
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Send Trial Link ──────────────────────────────────────────────────────────
function SendTrialLink({ senderName }: { senderName: string }) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email,       setEmail]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [sent,        setSent]        = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [err,         setErr]         = useState("");

  const trialUrl = `${APP_URL}/trial`;

  async function send() {
    if (!email || !companyName) { setErr("Company name and email are required."); return; }
    setErr(""); setSending(true);
    try {
      const r = await fetch(`${BASE}/api/trial/send-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, contactName, email, senderName }),
      });
      if (r.ok) {
        setSent(true);
        setCompanyName(""); setContactName(""); setEmail("");
        setTimeout(() => setSent(false), 4000);
      } else {
        const d = await r.json().catch(() => ({})) as { error?: string };
        setErr(d.error ?? "Failed to send — copy the link instead.");
      }
    } catch {
      setErr("Network error — copy the link below instead.");
    } finally { setSending(false); }
  }

  function copy() {
    navigator.clipboard.writeText(trialUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <Mail className="h-4 w-4 text-yellow-400" /> Send Trial Link
        </h2>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-yellow-400 transition"
        >
          {copied ? <><Check className="h-3.5 w-3.5 text-green-400" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy link</>}
        </button>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Send a branded email with a 30-day free trial invite directly to any company.
      </p>

      <div className="space-y-3">
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={companyName}
            onChange={e => { setCompanyName(e.target.value); setErr(""); }}
            placeholder="Company name *"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="Contact first name (optional)"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErr(""); }}
            placeholder="Email address *"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
          />
        </div>
      </div>

      {err && <p className="text-xs text-red-400">{err}</p>}

      <button
        onClick={send}
        disabled={!email || !companyName || sending}
        className="w-full rounded-xl bg-yellow-400 text-slate-950 font-black py-2.5 text-sm hover:bg-yellow-300 transition disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {sending ? (
          <><span className="animate-spin h-4 w-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 inline-block" /> Sending…</>
        ) : sent ? (
          <><Check className="h-4 w-4" /> Sent!</>
        ) : (
          <><Send className="h-4 w-4" /> Send Trial Invite</>
        )}
      </button>

      {/* Link preview */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 flex items-center gap-3">
        <span className="text-xs text-yellow-400 font-mono flex-1 truncate">{trialUrl}</span>
        <button onClick={copy} className="text-slate-500 hover:text-white transition shrink-0">
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ─── Helpers for assignment builder ──────────────────────────────────────────
interface Stop { aisle: string; slot: string; qty: string; checkCode: string; }
type BuildMode = "csv" | "manual" | "random";

function genRandom(count: number, s = 10, e = 30): Stop[] {
  return Array.from({ length: count }, () => ({
    aisle: String(Math.floor(s + Math.random() * (e - s + 1))),
    slot:  String(Math.floor(Math.random() * 200) + 1),
    qty:   String(Math.floor(Math.random() * 10) + 1),
    checkCode: String(Math.floor(100 + Math.random() * 900)),
  })).sort((a, b) => Number(a.aisle) - Number(b.aisle) || Number(a.slot) - Number(b.slot));
}

function parseCSV(text: string): Stop[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const start = lines[0]?.toLowerCase().includes("aisle") ? 1 : 0;
  return lines.slice(start).map(line => {
    const p = line.split(",");
    return { aisle: (p[0] ?? "").trim(), slot: (p[1] ?? "").trim(), qty: (p[2] ?? "").trim(), checkCode: (p[3] ?? "").trim() };
  }).filter(s => s.aisle && s.slot);
}

interface Assignment {
  id: string;
  title: string;
  assignmentNumber?: number;
  type?: string;
  totalCases: number;
  stops?: number;
  status: string;
  trainerUserId?: string | null;
  startAisle?: number;
  endAisle?: number;
  doorNumber?: number;
  goalTimeMinutes?: number | null;
}
interface Trainer { id: string; username: string; fullName: string | null; role?: string; }

// ─── Assignment Manager ───────────────────────────────────────────────────────
function AssignmentManager() {
  const jwtToken = useAuthStore(s => s.jwtToken);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [trainers,    setTrainers]    = useState<Trainer[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Create form state
  const [title,       setTitle]       = useState("");
  const [goalMin,     setGoalMin]     = useState("");
  const [mode,        setMode]        = useState<BuildMode>("random");
  const [stops,       setStops]       = useState<Stop[]>([]);
  const [randCount,   setRandCount]   = useState("20");
  const [randStart,   setRandStart]   = useState("10");
  const [randEnd,     setRandEnd]     = useState("30");
  const [csvErr,      setCsvErr]      = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saveErr,     setSaveErr]     = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, uRes] = await Promise.all([
        fetch(`${BASE}/api/assignments`, { headers }),
        fetch(`${BASE}/api/auth/users`,  { headers }),
      ]);
      if (aRes.ok) {
        const data = await aRes.json() as Assignment[];
        setAssignments(Array.isArray(data) ? data.sort((a, b) => new Date(b.status).getTime() - new Date(a.status).getTime()) : []);
      }
      if (uRes.ok) {
        const d = await uRes.json() as { users?: Trainer[] } | Trainer[];
        const list: Trainer[] = Array.isArray(d) ? d : (d.users ?? []);
        setTrainers(list.filter(u => (u as any).role === "trainer" || (u as any).role === "owner" || (u as any).role === "manager"));
      }
    } finally { setLoading(false); }
  }, [jwtToken]);

  useEffect(() => { load(); }, [load]);

  async function handleAssign(assignmentId: string, trainerId: string) {
    await fetch(`${BASE}/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ trainerUserId: trainerId || null }),
    });
    setAssigningId(null);
    load();
  }

  async function handleCreate() {
    if (stops.length === 0) { setSaveErr("Add at least one stop."); return; }
    setSaving(true); setSaveErr("");
    try {
      const sorted = [...stops].sort((a, b) => Number(a.aisle) - Number(b.aisle));
      const aisles = sorted.map(s => Number(s.aisle));
      const totalCases = stops.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
      const aRes = await fetch(`${BASE}/api/assignments`, {
        method: "POST", headers,
        body: JSON.stringify({
          assignmentNumber: Math.floor(1000 + Math.random() * 9000),
          title: title.trim() || `Training Run ${new Date().toLocaleDateString()}`,
          startAisle: Math.min(...aisles), endAisle: Math.max(...aisles),
          totalCases, totalCube: 0, totalPallets: 1, doorNumber: 1,
          status: "pending", voiceMode: "training",
          goalTimeMinutes: goalMin ? Number(goalMin) : null, percentComplete: 0,
        }),
      });
      if (!aRes.ok) throw new Error("Failed to create assignment");
      const asgn = await aRes.json() as { id: string };
      await fetch(`${BASE}/api/assignments/${asgn.id}/stops/bulk`, {
        method: "POST", headers,
        body: JSON.stringify({ stops: sorted.map((s, i) => ({
          aisle: Number(s.aisle), slot: Number(s.slot), qty: Number(s.qty),
          checkCode: s.checkCode.trim(), stopOrder: i,
        })) }),
      });
      setShowCreate(false);
      setTitle(""); setGoalMin(""); setStops([]); setMode("random");
      load();
    } catch (err: any) {
      setSaveErr(err.message ?? "Failed to save.");
    } finally { setSaving(false); }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setCsvErr("");
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = parseCSV(evt.target?.result as string);
        if (!parsed.length) { setCsvErr("No valid rows found. Expected: aisle,slot,qty,check"); return; }
        setStops(parsed);
      } catch { setCsvErr("Failed to parse CSV."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const isValid = stops.length > 0 && stops.every(s => s.aisle && s.slot && s.qty && s.checkCode);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-yellow-400" /> Assignment Manager
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></button>
          <button
            onClick={() => { setShowCreate(s => !s); setSaveErr(""); setStops([]); }}
            className="flex items-center gap-1.5 rounded-xl bg-yellow-400 text-slate-950 font-black px-3 py-1.5 text-xs hover:bg-yellow-300 transition"
          >
            <Plus className="h-3.5 w-3.5" /> New Assignment
          </button>
        </div>
      </div>

      {/* ── Create Form ── */}
      {showCreate && (
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5 space-y-4">
          <p className="text-sm font-black text-yellow-400">Create Assignment</p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Assignment Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Morning Shift — Wing A"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Goal Time (min)</label>
              <input type="number" value={goalMin} onChange={e => setGoalMin(e.target.value)} placeholder="60" min="1"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40" />
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex gap-2">
            {(["random", "csv", "manual"] as BuildMode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setStops([]); }}
                className={`flex-1 rounded-xl border py-2 text-xs font-bold transition ${mode === m ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-slate-700 text-slate-500 hover:border-slate-500"}`}>
                {m === "random" ? <><Shuffle className="h-3 w-3 inline mr-1" />Random</> : m === "csv" ? <><Upload className="h-3 w-3 inline mr-1" />CSV</> : <><Plus className="h-3 w-3 inline mr-1" />Manual</>}
              </button>
            ))}
          </div>

          {/* Mode inputs */}
          {mode === "random" && (
            <div className="grid grid-cols-3 gap-2">
              {[["Stops", randCount, setRandCount], ["Start Aisle", randStart, setRandStart], ["End Aisle", randEnd, setRandEnd]].map(([lbl, val, setter]) => (
                <div key={lbl as string}>
                  <label className="block text-xs text-slate-500 mb-1">{lbl as string}</label>
                  <input type="number" value={val as string} onChange={e => (setter as Function)(e.target.value)} min="1"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-400/40" />
                </div>
              ))}
              <div className="col-span-3">
                <button onClick={() => setStops(genRandom(Number(randCount) || 20, Number(randStart) || 10, Number(randEnd) || 30))}
                  className="w-full rounded-xl border border-yellow-400/40 bg-yellow-400/10 text-yellow-400 font-bold py-2 text-sm hover:bg-yellow-400/20 transition flex items-center justify-center gap-2">
                  <Shuffle className="h-4 w-4" /> Generate {randCount} Stops
                </button>
              </div>
            </div>
          )}

          {mode === "csv" && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Format: <code className="text-yellow-400">aisle,slot,qty,check</code></p>
              <label className="block rounded-xl border border-dashed border-slate-700 p-4 text-center cursor-pointer hover:border-slate-500 transition">
                <Upload className="h-5 w-5 text-slate-500 mx-auto mb-1" />
                <span className="text-xs text-slate-500">Click to upload CSV file</span>
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
              </label>
              {csvErr && <p className="text-xs text-red-400">{csvErr}</p>}
            </div>
          )}

          {mode === "manual" && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {stops.map((s, i) => (
                <div key={i} className="grid grid-cols-5 gap-1">
                  {(["aisle", "slot", "qty", "checkCode"] as (keyof Stop)[]).map(k => (
                    <input key={k} value={s[k]} onChange={e => setStops(p => p.map((r, idx) => idx === i ? { ...r, [k]: e.target.value } : r))}
                      placeholder={k === "checkCode" ? "chk" : k}
                      className="col-span-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-yellow-400/40" />
                  ))}
                  <button onClick={() => setStops(p => p.filter((_, idx) => idx !== i))} className="rounded-lg border border-slate-800 text-slate-600 hover:text-red-400 hover:border-red-400/30 transition flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => setStops(p => [...p, { aisle: "", slot: "", qty: "", checkCode: "" }])}
                className="w-full rounded-xl border border-dashed border-slate-700 py-2 text-xs text-slate-500 hover:border-slate-500 hover:text-white transition flex items-center justify-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Stop
              </button>
            </div>
          )}

          {stops.length > 0 && (
            <p className="text-xs text-green-400 font-bold">{stops.length} stops ready · {stops.reduce((sum, s) => sum + (Number(s.qty) || 0), 0)} total cases</p>
          )}
          {saveErr && <p className="text-xs text-red-400">{saveErr}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setShowCreate(false); setStops([]); }} className="flex-1 rounded-xl border border-slate-700 text-slate-400 py-2.5 text-sm font-bold hover:border-slate-500 transition">Cancel</button>
            <button onClick={handleCreate} disabled={!isValid || saving}
              className="flex-1 rounded-xl bg-yellow-400 text-slate-950 font-black py-2.5 text-sm hover:bg-yellow-300 transition disabled:opacity-40 flex items-center justify-center gap-2">
              {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="h-4 w-4" /> Save Assignment</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Assignment List ── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-56 rounded-2xl bg-slate-800/50 animate-pulse" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-10 w-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-bold">No assignments yet.</p>
          <p className="text-slate-600 text-xs mt-1">Click "New Assignment" above to build one and assign it to a trainer.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {assignments.map(a => {
            const assignedTrainer = trainers.find(t => t.id === a.trainerUserId);
            const isOpen = assigningId === a.id;
            const statusColor = a.status === "completed"
              ? "text-green-400"
              : a.status === "active"
              ? "text-blue-400"
              : "text-slate-500";

            return (
              <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex flex-col gap-3">

                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {a.assignmentNumber && (
                      <p className="text-lg font-black text-white">#{a.assignmentNumber}</p>
                    )}
                    <p className="text-xs text-slate-400 truncate max-w-[160px]">{a.title}</p>
                    <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      a.type === "PRODUCTION"
                        ? "bg-orange-500/10 text-orange-300 border-orange-500/30"
                        : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                    }`}>
                      {a.type ?? "TRAINING"}
                    </span>
                  </div>
                  {assignedTrainer ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Cases</span>
                    <span className="text-white font-bold">{a.totalCases}</span>
                  </div>
                  {a.stops != null && (
                    <div className="flex justify-between">
                      <span>Stops</span>
                      <span className="text-white font-bold">{a.stops}</span>
                    </div>
                  )}
                  {a.startAisle != null && (
                    <div className="flex justify-between">
                      <span>Aisles</span>
                      <span className="text-white font-bold">{a.startAisle}–{a.endAisle}</span>
                    </div>
                  )}
                  {a.doorNumber != null && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Door
                      </span>
                      <span className="text-yellow-300 font-bold">{a.doorNumber}</span>
                    </div>
                  )}
                  {a.goalTimeMinutes && (
                    <div className="flex justify-between">
                      <span>Goal</span>
                      <span className="text-white font-bold">{a.goalTimeMinutes} min</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className={`font-bold capitalize ${statusColor}`}>{a.status}</span>
                  </div>
                </div>

                {/* Assigned trainer */}
                <div className="border-t border-slate-800 pt-2.5">
                  {assignedTrainer ? (
                    <p className="text-xs text-green-300 font-semibold truncate">
                      ✓ {assignedTrainer.fullName ?? assignedTrainer.username}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 italic">Unassigned</p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                  <Link
                    href={`/nova/assignments/${a.id}`}
                    className="flex-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-center hover:border-slate-500 hover:text-white transition"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => setAssigningId(isOpen ? null : a.id)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold flex items-center justify-center gap-1 transition ${
                      isOpen
                        ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                        : assignedTrainer
                        ? "border-green-500/30 bg-green-500/10 text-green-400 hover:border-yellow-400 hover:bg-yellow-400/5 hover:text-yellow-400"
                        : "border-slate-700 hover:border-yellow-400 hover:text-yellow-400"
                    }`}
                  >
                    <ClipboardList className="h-3 w-3" />
                    {assignedTrainer ? "Reassign" : "Assign"}
                  </button>
                </div>

                {/* Trainer dropdown */}
                {isOpen && (
                  <div className="space-y-1 border-t border-slate-800 pt-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assign to trainer:</p>
                    <button
                      onClick={() => handleAssign(a.id, "")}
                      className="w-full text-left rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-500 hover:border-slate-500 hover:text-white transition"
                    >
                      — Unassign —
                    </button>
                    {trainers.length === 0 ? (
                      <p className="text-xs text-slate-600 px-1 py-1">No trainers yet. Invite a trainer first.</p>
                    ) : trainers.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleAssign(a.id, t.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2 text-xs font-bold transition ${
                          a.trainerUserId === t.id
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "border-slate-700 text-white hover:border-yellow-400 hover:bg-yellow-400/5"
                        }`}
                      >
                        {t.fullName ?? t.username}
                        <span className="ml-1 text-[10px] font-normal text-slate-500 capitalize">
                          {t.role}
                        </span>
                        {a.trainerUserId === t.id && <span className="ml-2 text-green-400 font-normal">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── NOVA Activity Panel ──────────────────────────────────────────────────────
interface NovaLaunch {
  id: string;
  createdAt: string;
  meta: string | null;
  username: string | null;
  fullName: string | null;
  companyName: string | null;
  role: string | null;
}

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NovaActivity() {
  const jwtToken = useAuthStore((s) => s.jwtToken);
  const [launches, setLaunches] = useState<NovaLaunch[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/metrics/nova-launches`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!r.ok) throw new Error("Failed");
      const d = await r.json() as { launches: NovaLaunch[] };
      setLaunches(d.launches);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
            <Activity className="h-4 w-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white">NOVA Sessions</p>
            <p className="text-xs text-slate-500">Live trainer activity</p>
          </div>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : launches.length === 0 ? (
        <div className="text-center py-8">
          <PlayCircle className="h-8 w-8 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No NOVA sessions yet.</p>
          <p className="text-slate-600 text-xs mt-1">Sessions appear here when trainers start them.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {launches.map((lnch) => {
            let selectorName = "";
            try {
              const parsed = JSON.parse(lnch.meta ?? "{}");
              selectorName = parsed.selectorName ?? parsed.selectorNovaId ?? "";
            } catch { /* ignore */ }

            return (
              <div key={lnch.id} className="flex items-center gap-3 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5">
                <div className="h-8 w-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {selectorName ? `Selector: ${selectorName}` : "Session started"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {lnch.companyName ?? lnch.fullName ?? lnch.username ?? "Unknown"} · {lnch.role ?? "trainer"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
                  <Clock className="h-3 w-3" />
                  {timeAgo(lnch.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Invite Activity Panel ────────────────────────────────────────────────────
interface InviteAlert {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
  meta: {
    role?: string;
    token?: string;
    inviteUrl?: string;
    generatedBy?: {
      id?: string;
      username?: string;
      fullName?: string;
      companyName?: string;
    };
  } | null;
}

const ROLE_COLOR: Record<string, string> = {
  manager:    "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  supervisor: "text-blue-400  border-blue-400/30  bg-blue-400/10",
  trainer:    "text-green-400 border-green-400/30 bg-green-400/10",
  selector:   "text-slate-400 border-slate-400/30 bg-slate-400/10",
};

function InviteActivity() {
  const jwtToken = useAuthStore(s => s.jwtToken);
  const [alerts,  setAlerts]  = useState<InviteAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` };

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/alerts`, { headers });
      if (!r.ok) throw new Error("failed");
      const d = await r.json() as { alerts: InviteAlert[] };
      const invite = (d.alerts ?? []).filter(a => a.type === "invite_shared") as InviteAlert[];
      setAlerts(invite);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [jwtToken]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  async function markRead(id: string) {
    await fetch(`${BASE}/api/alerts/${id}/read`, { method: "PATCH", headers });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }

  async function copyLink(id: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
    markRead(id);
  }

  const unread = alerts.filter(a => !a.read).length;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <UserPlus className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white flex items-center gap-2">
              Invite Activity
              {unread > 0 && (
                <span className="text-[10px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{unread} new</span>
              )}
            </p>
            <p className="text-xs text-slate-500">Every invite link generated across your platform</p>
          </div>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8">
          <UserPlus className="h-8 w-8 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No invite links generated yet.</p>
          <p className="text-slate-600 text-xs mt-1">When anyone generates a team invite, it shows up here.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {alerts.map(alert => {
            const meta = alert.meta ?? {};
            const role = meta.role ?? "unknown";
            const by = meta.generatedBy;
            const name = by?.fullName ?? by?.username ?? "Unknown";
            const company = by?.companyName ?? "";
            const inviteUrl = meta.inviteUrl;
            const isOpen = expanded === alert.id;
            const rc = ROLE_COLOR[role] ?? ROLE_COLOR.selector;

            return (
              <div
                key={alert.id}
                className={`rounded-xl border transition ${alert.read ? "border-slate-800 bg-slate-950/30" : "border-blue-500/20 bg-blue-500/5"}`}
              >
                {/* Row */}
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  onClick={() => {
                    setExpanded(isOpen ? null : alert.id);
                    if (!alert.read) markRead(alert.id);
                  }}
                >
                  <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${rc}`}>
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {name}
                      {company && <span className="text-slate-500 font-normal"> · {company}</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      Generated a <span className={`font-bold capitalize`}>{role}</span> invite link
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border capitalize ${rc}`}>{role}</span>
                    <span className="text-xs text-slate-600">{timeAgo(alert.createdAt)}</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-slate-600 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-800/60 space-y-2 mt-1">
                    <div className="text-xs text-slate-500 space-y-1">
                      <p><span className="text-slate-400 font-bold">Sent by:</span> {name} {company ? `(${company})` : ""}</p>
                      <p><span className="text-slate-400 font-bold">Role:</span> <span className="capitalize">{role}</span></p>
                      {meta.token && (
                        <p><span className="text-slate-400 font-bold">Token:</span> <span className="font-mono text-[10px] text-slate-500">{meta.token.slice(0, 20)}…</span></p>
                      )}
                    </div>

                    {inviteUrl ? (
                      <div className="flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                        <span className="text-[10px] font-mono text-slate-400 flex-1 truncate">{inviteUrl}</span>
                        <button
                          onClick={() => copyLink(alert.id, inviteUrl)}
                          className="text-slate-500 hover:text-yellow-400 transition"
                        >
                          {copied === alert.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 italic">Invite URL not recorded — generate a new one from the Build Your Team page.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Customer Help Requests ───────────────────────────────────────────────────
interface HelpAlert {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
  meta: {
    note?: string;
    requestedBy?: {
      id?: string;
      username?: string;
      fullName?: string;
      companyName?: string;
    };
  } | null;
}

function HelpRequests() {
  const jwtToken = useAuthStore(s => s.jwtToken);
  const [requests, setRequests] = useState<HelpAlert[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` };

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/alerts`, { headers });
      if (!r.ok) throw new Error("failed");
      const d = await r.json() as { alerts: HelpAlert[] };
      setRequests((d.alerts ?? []).filter(a => a.type === "help_request") as HelpAlert[]);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [jwtToken]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  async function markRead(id: string) {
    await fetch(`${BASE}/api/alerts/${id}/read`, { method: "PATCH", headers });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, read: true } : r));
  }

  const unread = requests.filter(r => !r.read).length;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
            <Wrench className="h-4 w-4 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white flex items-center gap-2">
              Assignment Help Requests
              {unread > 0 && (
                <span className="text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{unread} new</span>
              )}
            </p>
            <p className="text-xs text-slate-500">Customers requesting help building their assignments</p>
          </div>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-8 w-8 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No help requests yet.</p>
          <p className="text-slate-600 text-xs mt-1">When a customer clicks "Request Help" from their trainer portal, it appears here.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {requests.map(req => {
            const by = req.meta?.requestedBy;
            const name = by?.fullName ?? by?.username ?? "Unknown";
            const company = by?.companyName ?? "";
            const note = req.meta?.note ?? "";
            const isOpen = expanded === req.id;

            return (
              <div
                key={req.id}
                className={`rounded-xl border transition ${req.read ? "border-slate-800 bg-slate-950/30" : "border-orange-500/20 bg-orange-500/5"}`}
              >
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  onClick={() => {
                    setExpanded(isOpen ? null : req.id);
                    if (!req.read) markRead(req.id);
                  }}
                >
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {name}
                      {company && <span className="text-slate-500 font-normal"> · {company}</span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {note ? `"${note.slice(0, 60)}${note.length > 60 ? "…" : ""}"` : "Needs help building an assignment"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-600">{timeAgo(req.createdAt)}</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-slate-600 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-800/60 space-y-3 mt-1">
                    <div className="text-xs text-slate-500 space-y-1">
                      <p><span className="text-slate-400 font-bold">From:</span> {name} {company ? `(${company})` : ""}</p>
                    </div>
                    {note && (
                      <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5">
                        <p className="text-xs text-slate-400 font-bold mb-1">Their request:</p>
                        <p className="text-sm text-white leading-relaxed">{note}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-600 italic">
                      Build their assignment in the Assignment Control section above and assign it to them.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CommandPage() {
  const { currentUser, logout } = useAuthStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!currentUser) navigate("/login?redirect=/command", { replace: true });
    else if (currentUser.role !== "owner") navigate("/", { replace: true });
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-[#0a0e1a]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
              <LayoutDashboard className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-none">Command Center</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.fullName ?? currentUser.username} · {currentUser.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-500 transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Left: nav cards ── */}
          <div className="lg:col-span-2 space-y-8">
            {NAV_SECTIONS.map(section => (
              <div key={section.label}>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                  {section.label}
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {section.items.map(item => {
                    const c = COLOR[item.color];
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} href={item.path}>
                        <div className={`group rounded-2xl border bg-slate-900 p-5 cursor-pointer transition ${c.border} ${c.hover}`}>
                          <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl mb-4 ${c.icon}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-black text-white mb-1">{item.label}</p>
                          <p className="text-xs text-slate-500 leading-snug">{item.desc}</p>
                          <div className={`flex items-center gap-1 mt-3 text-xs font-bold ${c.text} opacity-0 group-hover:opacity-100 transition`}>
                            Open <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ── Send Trial Link ── */}
            <SendTrialLink senderName={currentUser.fullName ?? currentUser.username} />
          </div>

          {/* ── Right: invite ── */}
          <div>
            <QuickInvite />
          </div>
        </div>

        {/* ── Full-width: Help Requests ── */}
        <div className="mt-8">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            Customer Help Requests
          </p>
          <HelpRequests />
        </div>

        {/* ── Full-width: Invite Activity ── */}
        <div className="mt-8">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            Invite Activity
          </p>
          <InviteActivity />
        </div>

        {/* ── Full-width: Assignments ── */}
        <div className="mt-8">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            Assignment Control
          </p>
          <AssignmentManager />
        </div>

        {/* ── Full-width: Trial Signups ── */}
        <div className="mt-8">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            Trial Activity
          </p>
          <TrialSignups />
        </div>

        {/* ── Full-width: NOVA Sessions ── */}
        <div className="mt-8">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            NOVA Trainer Sessions
          </p>
          <NovaActivity />
        </div>
      </div>
    </div>
  );
}
