import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Mic, BookOpen, BarChart2, Trophy,
  Globe, Shield, FlaskConical, DollarSign, UserPlus, Mail,
  Check, Copy, ExternalLink, Activity, Send, ChevronRight,
  Warehouse, Settings, FileText, Download, Smartphone, X,
  Eye, Lock, Building2, Zap, HelpCircle, Navigation,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const APP_URL = `${window.location.origin}${BASE}`;

// ─── All platform pages ────────────────────────────────────────────────────────
const PAGES = [
  {
    section: "Public",
    color: "blue",
    icon: Globe,
    pages: [
      { label: "Home", path: "/", icon: Globe, desc: "Landing page" },
      { label: "Pricing", path: "/pricing", icon: DollarSign, desc: "Plans & pricing" },
      { label: "Download", path: "/download", icon: Download, desc: "App install instructions" },
      { label: "Privacy Policy", path: "/privacy", icon: FileText, desc: "Privacy document" },
      { label: "Terms of Service", path: "/terms", icon: FileText, desc: "Terms document" },
      { label: "Request Access", path: "/request-access", icon: UserPlus, desc: "Public signup request" },
    ],
  },
  {
    section: "Training",
    color: "yellow",
    icon: BookOpen,
    pages: [
      { label: "Training Hub", path: "/training", icon: BookOpen, desc: "All modules" },
      { label: "Progress", path: "/progress", icon: BarChart2, desc: "My progress" },
      { label: "Leaderboard", path: "/leaderboard", icon: Trophy, desc: "Top selectors" },
      { label: "Common Mistakes", path: "/mistakes", icon: X, desc: "Error coaching" },
      { label: "Selector Nation", path: "/selector-nation", icon: Navigation, desc: "Community" },
    ],
  },
  {
    section: "NOVA Voice",
    color: "purple",
    icon: Mic,
    pages: [
      { label: "NOVA Selector", path: "/selector", icon: Mic, desc: "ES3 picking session" },
      { label: "NOVA Help", path: "/nova-help", icon: HelpCircle, desc: "AI voice coach" },
      { label: "NOVA Trainer", path: "/nova-trainer", icon: Zap, desc: "Trainer mode" },
      { label: "NOVA Control", path: "/nova/control", icon: Settings, desc: "Voice settings" },
      { label: "NOVA Warehouse", path: "/nova/warehouse", icon: Warehouse, desc: "Warehouse map" },
      { label: "NOVA Slots", path: "/nova/slots", icon: LayoutDashboard, desc: "Slot assignments" },
      { label: "NOVA Voice Commands", path: "/nova/voice-commands", icon: Mic, desc: "Command reference" },
      { label: "NOVA Tracking", path: "/nova/tracking", icon: Activity, desc: "Live tracking" },
    ],
  },
  {
    section: "Management",
    color: "green",
    icon: Users,
    pages: [
      { label: "Trainer Portal", path: "/trainer-portal", icon: LayoutDashboard, desc: "Trainer dashboard" },
      { label: "Supervisor", path: "/supervisor", icon: Shield, desc: "Supervisor view" },
      { label: "Users & Access", path: "/users-access", icon: Users, desc: "Invite & manage users" },
      { label: "Warehouse Entry", path: "/w/default", icon: Warehouse, desc: "Warehouse selector" },
    ],
  },
  {
    section: "Admin",
    color: "red",
    icon: Shield,
    pages: [
      { label: "Owner Dashboard", path: "/owner", icon: Shield, desc: "Full admin panel" },
      { label: "Owner Access", path: "/owner-access", icon: Lock, desc: "Magic login link" },
      { label: "Company Onboard", path: "/checkout/company/onboard", icon: Building2, desc: "Onboarding flow" },
      { label: "Selector Portal", path: "/selector", icon: Navigation, desc: "Role selector" },
    ],
  },
  {
    section: "Demo",
    color: "orange",
    icon: FlaskConical,
    pages: [
      { label: "Demo Landing", path: "/demo", icon: FlaskConical, desc: "Demo home" },
      { label: "Demo Training", path: "/demo/training", icon: BookOpen, desc: "Demo training" },
      { label: "Demo Leaderboard", path: "/demo/leaderboard", icon: Trophy, desc: "Demo leaderboard" },
      { label: "Demo Trainer", path: "/demo/trainer-dashboard", icon: LayoutDashboard, desc: "Demo trainer" },
      { label: "Demo Supervisor", path: "/demo/supervisor-dashboard", icon: Shield, desc: "Demo supervisor" },
      { label: "Demo NOVA Agent", path: "/demo/nova-agent", icon: Mic, desc: "Demo NOVA" },
      { label: "Demo NOVA Help", path: "/demo/nova-help", icon: HelpCircle, desc: "Demo AI coach" },
      { label: "Demo NOVA Gate", path: "/demo/nova-gate", icon: Lock, desc: "Demo gate" },
      { label: "Demo NOVA Trainer", path: "/demo/nova-trainer", icon: Zap, desc: "Demo trainer mode" },
    ],
  },
];

const COLOR_MAP: Record<string, { badge: string; card: string; glow: string; icon: string }> = {
  blue:   { badge: "bg-blue-500/10 text-blue-400 border-blue-500/20", card: "hover:border-blue-500/40", glow: "text-blue-400", icon: "bg-blue-500/10" },
  yellow: { badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", card: "hover:border-yellow-400/40", glow: "text-yellow-400", icon: "bg-yellow-400/10" },
  purple: { badge: "bg-purple-500/10 text-purple-400 border-purple-500/20", card: "hover:border-purple-500/40", glow: "text-purple-400", icon: "bg-purple-500/10" },
  green:  { badge: "bg-green-500/10 text-green-400 border-green-500/20", card: "hover:border-green-500/40", glow: "text-green-400", icon: "bg-green-500/10" },
  red:    { badge: "bg-red-500/10 text-red-400 border-red-500/20", card: "hover:border-red-500/40", glow: "text-red-400", icon: "bg-red-500/10" },
  orange: { badge: "bg-orange-500/10 text-orange-400 border-orange-500/20", card: "hover:border-orange-500/40", glow: "text-orange-400", icon: "bg-orange-500/10" },
};

const ACTIVITY = [
  { action: "Owner logged in", time: "just now", icon: Lock, color: "text-yellow-400" },
  { action: "Invite sent to trainer", time: "11m ago", icon: Mail, color: "text-blue-400" },
  { action: "Selector started NOVA session", time: "24m ago", icon: Mic, color: "text-purple-400" },
  { action: "Role changed: selector → trainer", time: "2h ago", icon: Users, color: "text-green-400" },
  { action: "New company subscription", time: "3h ago", icon: Building2, color: "text-yellow-400" },
  { action: "User completed Training Module 3", time: "4h ago", icon: BookOpen, color: "text-blue-400" },
  { action: "Leaderboard updated", time: "5h ago", icon: Trophy, color: "text-orange-400" },
];

// ─── Invite section ─────────────────────────────────────────────────────────
function QuickInvite() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("selector");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  function generateInviteUrl() {
    if (!name || !email) return;
    const payload = { name, email, role, exp: Date.now() + 7 * 86400000 };
    const token = btoa(JSON.stringify(payload));
    return `${APP_URL}/invite/${token}`;
  }

  async function handleGenerate() {
    setErr("");
    const url = generateInviteUrl();
    if (!url) { setErr("Name and email are required."); return; }
    setInviteUrl(url);
    setSent(false);
  }

  async function handleSend() {
    if (!inviteUrl) return;
    setSending(true); setErr("");
    try {
      const r = await fetch(`${BASE}/api/invites/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, inviteUrl }),
      });
      if (r.ok) { setSent(true); }
      else {
        const d = await r.json().catch(() => ({}));
        setErr(d.error ?? "Send failed. Invite link copied instead.");
        navigator.clipboard.writeText(inviteUrl).catch(() => {});
      }
    } catch {
      setErr("Network error. Invite link copied.");
      navigator.clipboard.writeText(inviteUrl).catch(() => {});
    } finally { setSending(false); }
  }

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-yellow-400" /> Quick Invite
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Full name"
          className="rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
        />
        <input
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          className="rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
        />
      </div>
      <select
        value={role} onChange={e => setRole(e.target.value)}
        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
      >
        <option value="selector">Selector</option>
        <option value="trainer">Trainer</option>
        <option value="supervisor">Supervisor</option>
        <option value="owner">Owner</option>
      </select>
      <button
        onClick={handleGenerate}
        disabled={!name || !email}
        className="w-full rounded-2xl bg-yellow-400 px-4 py-2.5 font-bold text-sm text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40"
      >
        Generate Invite Link
      </button>
      {inviteUrl && (
        <div className="space-y-3 pt-1">
          <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-400 break-all font-mono">
            {inviteUrl}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? <><span className="animate-spin h-4 w-4 rounded-full border-2 border-white/30 border-t-white" /> Sending…</>
                : sent ? <><Check className="h-4 w-4 text-green-300" /> Email Sent!</>
                : <><Send className="h-4 w-4" /> Send Email</>}
            </button>
            <button
              onClick={handleCopy}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:border-yellow-400 px-4 py-2 text-sm font-semibold text-white transition flex items-center gap-2"
            >
              {copied ? <><Check className="h-4 w-4 text-green-400" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
            </button>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          {sent && <p className="text-xs text-green-400">✓ Invite email sent to {email}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function CommandPage() {
  const { currentUser } = useAuthStore();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const filtered = PAGES.map(s => ({
    ...s,
    pages: s.pages.filter(
      p => !search || p.label.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(s => s.pages.length > 0);

  const totalPages = PAGES.reduce((acc, s) => acc + s.pages.length, 0);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-[#0a0e1a]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-yellow-400 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none">Command Center</h1>
              <p className="text-xs text-slate-500 mt-0.5">{totalPages} pages · PickSmart NOVA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
              {currentUser?.name ?? "Owner"} · {currentUser?.role ?? "owner"}
            </span>
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:border-yellow-400 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open Site
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Pages", value: totalPages, icon: Globe, color: "text-blue-400" },
            { label: "Sections", value: PAGES.length, icon: LayoutDashboard, color: "text-yellow-400" },
            { label: "Active Users", value: "37", icon: Users, color: "text-green-400" },
            { label: "Sessions Today", value: "981", icon: Activity, color: "text-purple-400" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color} shrink-0`} />
              <div>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search pages…"
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
        />

        {/* Quick links */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Owner Dashboard", path: "/owner" },
            { label: "Users & Access", path: "/users-access" },
            { label: "NOVA Selector", path: "/selector" },
            { label: "Trainer Portal", path: "/trainer-portal" },
            { label: "Download App", path: "/download" },
          ].map(l => (
            <Link key={l.path} href={l.path}>
              <span className="flex items-center gap-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-4 py-1.5 text-xs font-bold hover:bg-yellow-400/20 transition cursor-pointer">
                {l.label} <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Page sections */}
          <div className="lg:col-span-2 space-y-6">
            {filtered.map(section => {
              const c = COLOR_MAP[section.color];
              const Icon = section.icon;
              return (
                <div key={section.section} className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
                    <div className={`h-8 w-8 rounded-xl ${c.icon} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${c.glow}`} />
                    </div>
                    <h2 className="font-bold text-white">{section.section}</h2>
                    <span className={`ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full border ${c.badge}`}>
                      {section.pages.length} pages
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-800">
                    {section.pages.map(p => {
                      const PIcon = p.icon;
                      return (
                        <Link key={p.path} href={p.path}>
                          <div className={`group flex items-center gap-3 bg-slate-900 p-4 cursor-pointer border border-transparent ${c.card} transition`}>
                            <div className={`h-8 w-8 rounded-lg ${c.icon} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                              <PIcon className={`h-4 w-4 ${c.glow}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{p.label}</p>
                              <p className="text-xs text-slate-500 truncate">{p.desc}</p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 ml-auto shrink-0 transition" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <QuickInvite />

            {/* Activity feed */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" /> Activity
              </h2>
              <div className="space-y-1">
                {ACTIVITY.map((a, i) => {
                  const AIcon = a.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
                      <AIcon className={`h-4 w-4 mt-0.5 shrink-0 ${a.color}`} />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-300">{a.action}</p>
                        <p className="text-xs text-slate-600">{a.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile app card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-yellow-400" /> Mobile App
              </h2>
              <p className="text-sm text-slate-400">Control everything from your phone with the PickSmart NOVA mobile app.</p>
              <Link href="/download">
                <span className="flex items-center justify-center gap-2 w-full rounded-2xl bg-yellow-400 px-4 py-2.5 font-bold text-sm text-slate-950 hover:bg-yellow-300 transition cursor-pointer">
                  <Download className="h-4 w-4" /> Get the App
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
