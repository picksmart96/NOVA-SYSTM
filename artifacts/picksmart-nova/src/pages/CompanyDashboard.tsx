import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import {
  Activity, Copy, Check, ChevronRight, Users, ShieldCheck,
  UserCog, UserCircle, Warehouse, Star, LogOut, ExternalLink,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const APP_URL  = import.meta.env.VITE_APP_URL  ?? "https://nova-warehouse-control.replit.app";

type Role = "manager" | "supervisor" | "trainer";

interface RoleCard {
  role: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
}

const ROLES: RoleCard[] = [
  {
    role: "manager",
    label: "Manager",
    description: "Full company oversight — reports, billing, user management, all portals.",
    icon: <UserCog className="h-6 w-6" />,
    color: "yellow",
    badge: "Full Access",
  },
  {
    role: "supervisor",
    label: "Supervisor",
    description: "Live monitor, selector coaching, alerts, and performance dashboards.",
    icon: <ShieldCheck className="h-6 w-6" />,
    color: "blue",
    badge: "Team Lead",
  },
  {
    role: "trainer",
    label: "Trainer",
    description: "Build training sessions, assign selectors, track module progress.",
    icon: <Users className="h-6 w-6" />,
    color: "green",
    badge: "Training",
  },
];

const COLOR_MAP: Record<string, Record<string, string>> = {
  yellow: {
    icon:   "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    border: "border-yellow-400/40",
    bg:     "bg-yellow-400/5",
    btn:    "bg-yellow-400 hover:bg-yellow-300 text-slate-950",
    badge:  "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20",
  },
  blue: {
    icon:   "bg-blue-400/10 text-blue-400 border-blue-400/20",
    border: "border-blue-400/40",
    bg:     "bg-blue-400/5",
    btn:    "bg-blue-500 hover:bg-blue-400 text-white",
    badge:  "bg-blue-400/10 text-blue-400 border border-blue-400/20",
  },
  green: {
    icon:   "bg-green-400/10 text-green-400 border-green-400/20",
    border: "border-green-400/40",
    bg:     "bg-green-400/5",
    btn:    "bg-green-500 hover:bg-green-400 text-white",
    badge:  "bg-green-400/10 text-green-400 border border-green-400/20",
  },
};

function InviteCard({ card }: { card: RoleCard }) {
  const { jwtToken, currentUser } = useAuthStore();
  const c = COLOR_MAP[card.color];

  const [link, setLink]       = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          role: card.role,
          warehouseSlug: currentUser?.warehouseSlug ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to generate"); return; }
      setLink(`${APP_URL}/invite?token=${data.token}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className={`rounded-2xl border ${link ? c.border : "border-slate-800"} ${link ? c.bg : "bg-slate-900/50"} p-5 flex flex-col gap-4 transition-all duration-300`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${c.icon}`}>
          {card.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-black text-base">{card.label}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.badge}`}>
              {card.badge}
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">{card.description}</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {link ? (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Invite Link Ready</p>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5">
            <p className="flex-1 text-xs text-slate-300 font-mono truncate">{link}</p>
            <button
              onClick={copy}
              className="shrink-0 p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-400 hover:text-white"
              title="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copy}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition ${copied ? "bg-green-500 text-white" : c.btn}`}
            >
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Link</>}
            </button>
            <button
              onClick={generate}
              title="Generate new link"
              className="px-3 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition disabled:opacity-50 ${c.btn}`}
        >
          {loading ? (
            <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
          ) : (
            <>Generate {card.label} Invite Link <ExternalLink className="h-4 w-4" /></>
          )}
        </button>
      )}
    </div>
  );
}

export default function CompanyDashboard() {
  const [, navigate] = useLocation();
  const { currentUser, logout } = useAuthStore();

  const company   = currentUser?.companyName ?? "Your Company";
  const username  = currentUser?.username ?? "";
  const acctNum   = currentUser?.accountNumber ?? "PSA-XXXX";
  const trialEnd  = currentUser?.trialEndsAt
    ? new Date(currentUser.trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const daysLeft = currentUser?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(currentUser.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Top nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="bg-yellow-400 text-slate-950 p-1.5 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-black text-base">
            PickSmart <span className="text-yellow-400">NOVA</span>
          </span>
          <div className="flex-1" />
          <span className="text-xs text-slate-600 font-mono hidden sm:block">{username}</span>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Welcome hero */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
              <Warehouse className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black leading-tight">{company}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                  Trial
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Account <span className="font-mono text-slate-300">{acctNum}</span>
                {trialEnd && (
                  <> · Trial active until <span className="text-yellow-400 font-bold">{trialEnd}</span></>
                )}
              </p>
            </div>
          </div>

          {daysLeft !== null && (
            <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-5 py-4 flex items-center gap-4">
              <Star className="h-5 w-5 text-yellow-400 shrink-0" />
              <div className="flex-1">
                <p className="text-yellow-400 font-black text-sm">
                  {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining in your free trial
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Full company access. Upgrade anytime from your trainer portal.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Invite section */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">Build Your Team</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Generate a secure invite link for each role. Share it directly — no email required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ROLES.map((card) => (
              <InviteCard key={card.role} card={card} />
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 flex items-start gap-3">
            <UserCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Each link is unique and single-use. The person you send it to will create their own username and password when they accept. You can generate new links anytime.
            </p>
          </div>
        </div>

        {/* Next steps */}
        <div>
          <h2 className="text-lg font-black text-white mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/warehouse-setup?from=dashboard")}
              className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/60 p-5 text-left transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center shrink-0 text-yellow-400 transition">
                <Warehouse className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm">Set Up Warehouse</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-snug">Calibrate NOVA for your picking system, location format, and zones.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition shrink-0" />
            </button>

            <button
              onClick={() => navigate("/trainer-portal")}
              className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/60 p-5 text-left transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center shrink-0 text-green-400 transition">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm">Trainer Portal</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-snug">Create training sessions, assign selectors, and track progress.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition shrink-0" />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
