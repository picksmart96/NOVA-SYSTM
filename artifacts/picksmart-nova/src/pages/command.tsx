import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Mic, Shield, UserPlus,
  Check, Copy, Send, Zap, HelpCircle,
  ClipboardList, Warehouse, LogOut, ChevronRight,
  Mail, Building2, User, RefreshCw, Clock,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const APP_URL = `${window.location.origin}${BASE}`;

// ─── Nav cards ───────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Management",
    items: [
      { label: "Trainer Portal",    path: "/trainer-portal",      icon: LayoutDashboard, desc: "Manage selectors & sessions",  color: "yellow" },
      { label: "Supervisor",        path: "/supervisor",           icon: Shield,          desc: "Shift overview & metrics",     color: "green"  },
      { label: "Owner Dashboard",   path: "/owner",                icon: Users,           desc: "Accounts, billing & settings", color: "blue"   },
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
      { label: "Assignment Builder", path: "/assignment-builder", icon: ClipboardList, desc: "Build & upload pick assignments", color: "orange" },
      { label: "Warehouse Setup",    path: "/warehouse-setup",    icon: Warehouse,     desc: "Configure zones & locations",   color: "orange" },
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

  function generate() {
    if (!name || !email) { setErr("Name and email are required."); return; }
    setErr("");
    const payload = { name, email, role, exp: Date.now() + 7 * 86400000 };
    setUrl(`${APP_URL}/invite/${btoa(JSON.stringify(payload))}`);
    setSent(false);
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

        {/* ── Full-width: Trial Signups ── */}
        <div className="mt-8">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            Trial Activity
          </p>
          <TrialSignups />
        </div>
      </div>
    </div>
  );
}
