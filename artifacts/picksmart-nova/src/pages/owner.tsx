import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Globe, Key, Link as LucideLink, ShieldCheck, Users, BookOpen, Mic, LayoutDashboard, Activity, Shield, UserPlus, Check, Mail, Share2, Warehouse as WarehouseIcon, FlaskConical, DollarSign, Building2, CreditCard, Plus, Send, AlertCircle, Phone, FileText, X, ChevronDown, ChevronUp, MessageCircle, CheckCircle2, Clock, Youtube, TrendingUp, BarChart3, Briefcase, ChevronRight, Edit3, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { OWNER_TOKEN } from "./owner-access";
import { useAuthStore, AuthAccount, AuthRole } from "@/lib/authStore";
import { useAccessStore } from "@/lib/accessStore";
import { useWarehouseStore } from "@/lib/warehouseStore";
import { DEFAULT_WAREHOUSES, SYSTEM_TYPE_LABEL } from "@/data/warehouses";
import { useCompanyRequestStore, CompanyRequest } from "@/lib/companyRequestStore";
import { useTalkRequestStore, TalkRequest } from "@/lib/talkRequestStore";
import { useLessonVideoStore, extractYoutubeId } from "@/lib/lessonVideoStore";
import { LESSON_VIDEO_MAP } from "@/data/lessonVideoMap";
import { useLeadStore, Lead, LeadStatus, STATUS_OPTIONS, HANDBOOK_SECTIONS } from "@/lib/leadStore";

// ── Mock data for demo sections ───────────────────────────────────────────────
const ADMIN_STATS = {
  totalSubscribers: 148,
  personalSubscribers: 102,
  companySubscribers: 46,
  activeUsersToday: 37,
  totalSessions: 981,
  bannedUsers: 4,
};

const ACTIVITY_LOG = [
  { id: 1, action: "User subscribed to Company plan", user: "John Smith", time: "2m ago" },
  { id: 2, action: "Trainer invite sent", user: "Owner", time: "11m ago" },
  { id: 3, action: "Selector started NOVA session", user: "Maria Lopez", time: "24m ago" },
  { id: 4, action: "User banned by owner", user: "Owner → Carlos R.", time: "1h ago" },
  { id: 5, action: "Role changed: selector → trainer", user: "James T.", time: "2h ago" },
  { id: 6, action: "Login recorded", user: "Ana Mendez", time: "3h ago" },
  { id: 7, action: "User subscribed to Personal plan", user: "Kevin P.", time: "5h ago" },
];

const PLANS = [
  {
    key: "personal",
    label: "Personal",
    price: "—",
    features: ["Training", "NOVA Help", "NOVA Trainer", "Common Mistakes", "Leaderboard", "Selector Nation"],
    visible: true,
  },
  {
    key: "company",
    label: "Company",
    price: "—",
    features: ["Everything in Personal", "Trainer Dashboard", "Supervisor Dashboard", "Team workflow tools"],
    visible: true,
  },
];

// ── Public Page Link + Owner Magic Link ───────────────────────────────────────
function PublicPageLink() {
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedDemo,   setCopiedDemo]   = useState(false);
  const [copiedMagic,  setCopiedMagic]  = useState(false);

  const base      = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  const publicUrl = `${window.location.origin}${base}/`;
  const demoUrl   = `${window.location.origin}${base}/demo`;
  const magicUrl  = `${window.location.origin}${base}/owner-access?token=${OWNER_TOKEN}`;

  function copyPublic() {
    navigator.clipboard.writeText(publicUrl);
    setCopiedPublic(true);
    setTimeout(() => setCopiedPublic(false), 2000);
  }

  function copyDemo() {
    navigator.clipboard.writeText(demoUrl);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  }

  function copyMagic() {
    navigator.clipboard.writeText(magicUrl);
    setCopiedMagic(true);
    setTimeout(() => setCopiedMagic(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Public home page */}
      <div className="rounded-3xl border border-yellow-400/40 bg-yellow-400/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-400/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <p className="font-black text-white text-sm">Public Page Link</p>
            <p className="text-xs text-slate-400">Share this link to send people to the public home page</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
          <p className="flex-1 font-mono text-sm text-yellow-300 truncate">{publicUrl}</p>
          <button
            onClick={copyPublic}
            className="flex items-center gap-1.5 rounded-xl bg-yellow-400 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-yellow-300 transition shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedPublic ? "Copied!" : "Copy"}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-yellow-400 hover:text-yellow-400 transition shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </a>
        </div>
      </div>

      {/* Demo link */}
      <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="font-black text-white text-sm">Public Demo Link</p>
            <p className="text-xs text-slate-400">Share this to let anyone explore the platform without signing up</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
          <p className="flex-1 font-mono text-sm text-blue-300 truncate">{demoUrl}</p>
          <button
            onClick={copyDemo}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-400 transition shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedDemo ? "Copied!" : "Copy"}
          </button>
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-blue-400 hover:text-blue-400 transition shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview
          </a>
        </div>
      </div>

      {/* Owner magic link */}
      <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Key className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="font-black text-white text-sm">Owner Magic Link <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">Private</span></p>
            <p className="text-xs text-slate-400">Visit this URL to log in instantly as owner — keep it secret</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
          <p className="flex-1 font-mono text-xs text-red-300 truncate">{magicUrl}</p>
          <button
            onClick={copyMagic}
            className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-black text-white hover:bg-red-400 transition shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedMagic ? "Copied!" : "Copy"}
          </button>
          <a
            href={magicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-red-400 hover:text-red-400 transition shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Test
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function StatCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "danger" | "default" }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs text-slate-500 uppercase tracking-widest">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone === "danger" ? "text-red-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: "bg-yellow-500/20 text-yellow-300",
    supervisor: "bg-purple-500/20 text-purple-300",
    trainer: "bg-blue-500/20 text-blue-300",
    selector: "bg-slate-700 text-slate-300",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors[role] ?? "bg-slate-700 text-slate-300"}`}>
      {role}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string | null }) {
  const colors: Record<string, string> = {
    owner: "bg-yellow-500/20 text-yellow-300",
    company: "bg-cyan-500/20 text-cyan-300",
    personal: "bg-green-500/20 text-green-300",
  };
  const label = plan ?? "none";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors[label] ?? "bg-slate-700 text-slate-300"}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500/20 text-green-300",
    banned: "bg-red-500/20 text-red-400",
    inactive: "bg-slate-700 text-slate-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors[status] ?? "bg-slate-700 text-slate-300"}`}>
      {status}
    </span>
  );
}

// ── User Management ───────────────────────────────────────────────────────────
function UserManagement() {
  const { accounts, banUser, unbanUser, changeRole, removeAccount } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const filtered = accounts.filter((a) => {
    const matchSearch =
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || a.role === filterRole;
    const matchPlan = filterPlan === "all" || a.subscriptionPlan === filterPlan;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchRole && matchPlan && matchStatus;
  });

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-black mb-5">User Management</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or username…"
          className="flex-1 min-w-[160px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="all">All Roles</option>
          <option value="selector">Selector</option>
          <option value="trainer">Trainer</option>
          <option value="supervisor">Supervisor</option>
          <option value="manager">Manager</option>
          <option value="owner">Owner</option>
        </select>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="all">All Plans</option>
          <option value="personal">Personal</option>
          <option value="company">Company</option>
          <option value="owner">Owner</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* User rows */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-slate-600 text-sm text-center py-6">No users match your filters.</p>
        )}
        {filtered.map((u) => (
          <div key={u.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <p className="font-bold text-white">{u.fullName}</p>
                <p className="text-xs text-slate-500">@{u.username}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <RoleBadge role={u.role} />
                <PlanBadge plan={u.subscriptionPlan} />
                <StatusBadge status={u.status} />
              </div>
            </div>

            {/* Actions */}
            {u.id !== "master" && (
              <div className="flex flex-wrap gap-2">
                {/* Change Role inline */}
                {changingRole === u.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                      defaultValue={u.role}
                      onChange={(e) => {
                        changeRole(u.id, e.target.value as AuthRole);
                        setChangingRole(null);
                      }}
                    >
                      {(["selector","trainer","supervisor","manager"] as AuthRole[]).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setChangingRole(null)}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setChangingRole(u.id)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-yellow-400 transition"
                  >
                    Change Role
                  </button>
                )}

                {u.status === "banned" ? (
                  <button
                    onClick={() => unbanUser(u.id)}
                    className="rounded-lg border border-green-500/30 px-3 py-1.5 text-xs text-green-300 hover:bg-green-500/10 transition"
                  >
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() => banUser(u.id)}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition"
                  >
                    Ban
                  </button>
                )}

                <button
                  onClick={() => { if (confirm(`Remove account for ${u.fullName}?`)) removeAccount(u.id); }}
                  className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Invite Management ─────────────────────────────────────────────────────────
function InviteManagement() {
  const { addInvite, pendingInvites } = useAuthStore();
  const { customWarehouses } = useWarehouseStore();
  const allWarehouses = [...DEFAULT_WAREHOUSES, ...customWarehouses];
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AuthRole>("selector");
  const [warehouseSlug, setWarehouseSlug] = useState(allWarehouses[0]?.slug ?? "");
  const [lastLink, setLastLink] = useState<string | null>(null);

  function sendInvite() {
    if (!fullName.trim() || !email.trim()) return;
    const selectedWarehouse = allWarehouses.find((w) => w.slug === warehouseSlug) ?? null;
    const token = addInvite({
      fullName: fullName.trim(),
      email: email.trim(),
      role,
      warehouseId: selectedWarehouse?.id ?? null,
      warehouseSlug: selectedWarehouse?.slug ?? null,
    });
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    const link = `${window.location.origin}${base}/invite/${token}`;
    setLastLink(link);
    setFullName("");
    setEmail("");
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-black mb-5">Invite Management</h2>
      <div className="space-y-3">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AuthRole)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm"
        >
          {(["selector","trainer","supervisor","manager"] as AuthRole[]).map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <select
          value={warehouseSlug}
          onChange={(e) => setWarehouseSlug(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm"
        >
          <option value="">— No warehouse —</option>
          {allWarehouses.map((wh) => (
            <option key={wh.id} value={wh.slug}>
              {wh.name} ({wh.systemType === "es3" ? "ES3" : "Standard"})
            </option>
          ))}
        </select>
        <button
          onClick={sendInvite}
          className="w-full rounded-xl bg-yellow-400 py-2.5 font-black text-slate-950 hover:bg-yellow-300 transition text-sm"
        >
          Generate Invite Link
        </button>
      </div>

      {lastLink && (
        <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3">
          <p className="text-xs text-yellow-400 font-bold mb-1">Invite link generated:</p>
          <p className="text-xs text-slate-300 break-all font-mono">{lastLink}</p>
          {warehouseSlug && (
            <p className="text-xs text-slate-500 mt-1">
              Warehouse: {allWarehouses.find((w) => w.slug === warehouseSlug)?.name ?? warehouseSlug}
            </p>
          )}
          <button
            onClick={() => navigator.clipboard.writeText(lastLink)}
            className="mt-2 text-xs text-yellow-400 hover:underline"
          >
            Copy to clipboard
          </button>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Pending Invites</p>
          <div className="space-y-2">
            {pendingInvites.slice(-5).reverse().map((inv) => (
              <div key={inv.token} className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold">{inv.fullName}</p>
                  <p className="text-xs text-slate-500">{inv.email} · {inv.role}{inv.warehouseSlug ? ` · ${inv.warehouseSlug}` : ""}</p>
                </div>
                <RoleBadge role={inv.role} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Plan Control ──────────────────────────────────────────────────────────────
function PlanControl() {
  const [plans, setPlans] = useState(PLANS);

  function toggleVisibility(key: string) {
    setPlans((prev) => prev.map((p) => p.key === key ? { ...p, visible: !p.visible } : p));
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-black mb-5">Plan Control</h2>
      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.key} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold">{plan.label}</p>
              <button
                onClick={() => toggleVisibility(plan.key)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  plan.visible
                    ? "bg-green-500/20 text-green-300 hover:bg-red-500/20 hover:text-red-300"
                    : "bg-red-500/20 text-red-300 hover:bg-green-500/20 hover:text-green-300"
                }`}
              >
                {plan.visible ? "Visible" : "Hidden"}
              </button>
            </div>
            <ul className="text-xs text-slate-500 space-y-0.5">
              {plan.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-400">Pricing visibility, plan details, and feature toggles will connect to the backend when integrated.</p>
        </div>
      </div>
    </div>
  );
}

// ── Activity Log ──────────────────────────────────────────────────────────────
function ActivityLog() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-black mb-5">Admin Movement / Audit Log</h2>
      <div className="space-y-2">
        {ACTIVITY_LOG.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white">{item.action}</p>
              <p className="text-xs text-slate-500">{item.user}</p>
            </div>
            <span className="text-xs text-slate-600 shrink-0">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Handbook ──────────────────────────────────────────────────────────────────
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 mb-4 text-2xl font-black text-white border-b border-slate-800 pb-2">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 mb-2 text-lg font-bold text-yellow-400">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-300 text-sm leading-relaxed mb-3">{children}</p>;
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-300">
      {children}
    </div>
  );
}
function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-4 rounded-2xl border border-slate-800">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 bg-slate-900 text-xs font-bold uppercase tracking-widest text-slate-400">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-slate-300 border-t border-slate-800">{children}</td>;
}
function TdY({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 font-bold text-yellow-400 border-t border-slate-800">{children}</td>;
}
function Ul({ items }: { items: string[] }) {
  return (
    <ul className="mb-4 space-y-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-slate-300 text-sm">
          <span className="text-yellow-400 mt-0.5">•</span> {item}
        </li>
      ))}
    </ul>
  );
}

function HandbookSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.22em]">Reference</p>
        <h1 className="mt-2 text-4xl font-black">PickSmart NOVA — User Handbook</h1>
        <p className="mt-2 text-slate-400">Complete guide to using the platform.</p>
      </div>

      {/* What is it */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 mb-6">
        <P>PickSmart NOVA is a warehouse training platform built for grocery selectors and warehouse teams. It combines voice-directed picking simulation, AI coaching, team dashboards, and training modules — all in one place.</P>
      </div>

      {/* Getting Access */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 mb-6">
        <H2>1. Getting Access</H2>
        <H3>Step 1 — Visit the Site</H3>
        <P>The Home page and Pricing page are open to everyone — no account needed.</P>
        <H3>Step 2 — Choose a Plan</H3>
        <TableWrap>
          <thead><tr><Th>Plan</Th><Th>Best For</Th><Th>What's Included</Th></tr></thead>
          <tbody>
            <tr><TdY>Personal</TdY><Td>Individual selectors</Td><Td>Training, NOVA Help, NOVA Trainer, Common Mistakes, Leaderboard, Selector Nation</Td></tr>
            <tr><TdY>Company</TdY><Td>Warehouses and teams</Td><Td>Everything in Personal + Trainer Dashboard + Supervisor Dashboard + Team tools</Td></tr>
          </tbody>
        </TableWrap>
        <H3>Step 3 — Checkout</H3>
        <P>Review what's included and click <strong className="text-white">Complete Personal Subscription</strong> or <strong className="text-white">Complete Company Subscription</strong>.</P>
        <Note>You must be signed in to complete checkout. If you aren't signed in yet, click Sign in first.</Note>
      </div>

      {/* Signing In */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 mb-6">
        <H2>2. Signing In</H2>
        <Ul items={[
          "Click Sign in in the top-right corner",
          "Enter your username and password",
          "Click Sign in",
        ]} />
        <Note>Every time you close the browser or refresh the page, you will need to sign in again. This is by design for security.</Note>
      </div>

      {/* Navigation */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 mb-6">
        <H2>3. Navigation Menu</H2>
        <H3>Personal Plan</H3>
        <TableWrap>
          <thead><tr><Th>Link</Th><Th>What It Does</Th></tr></thead>
          <tbody>
            {[["Home","Public landing page"],["Training","Training modules"],["NOVA Help","AI voice coach"],["Common Mistakes","Mistakes guide and coaching"],["Selector Nation","Community page"]].map(([l,d])=>(
              <tr key={l}><TdY>{l}</TdY><Td>{d}</Td></tr>
            ))}
          </tbody>
        </TableWrap>
        <H3>Company Plan (extra links by role)</H3>
        <TableWrap>
          <thead><tr><Th>Link</Th><Th>Who Sees It</Th><Th>What It Does</Th></tr></thead>
          <tbody>
            {[
              ["NOVA Trainer","All company","ES3 voice simulation trainer"],
              ["Trainer Dashboard","Trainer+","Manage selector training"],
              ["Supervisor Dashboard","Supervisor+","Team overview and tracking"],
              ["My Progress","All","Personal progress tracking"],
              ["Leaderboard","All","Ranked selector leaderboard"],
              ["Assignment Control","Trainer+","Create and assign picking jobs"],
              ["Slot Master","Trainer+","Manage slot assignments"],
              ["Warehouse Reference","Trainer+","Tower map and aisle reference"],
              ["Live Tracking","Supervisor+","Real-time selector tracking"],
            ].map(([l,w,d])=>(
              <tr key={l}><TdY>{l}</TdY><Td>{w}</Td><Td>{d}</Td></tr>
            ))}
          </tbody>
        </TableWrap>
        <H3>Owner Only</H3>
        <TableWrap>
          <thead><tr><Th>Link</Th><Th>What It Does</Th></tr></thead>
          <tbody>
            <tr><TdY>Control Center</TdY><Td>Full admin dashboard</Td></tr>
            <tr><TdY>Users & Access</TdY><Td>Invite and manage user accounts</Td></tr>
          </tbody>
        </TableWrap>
      </div>

      {/* NOVA Help */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 mb-6">
        <H2>4. NOVA Help — AI Voice Coach</H2>
        <P>NOVA Help is your personal AI coach. Ask it anything about picking, warehouse operations, building techniques, or voice commands. It works in both English and Spanish.</P>
        <H3>How to Use</H3>
        <Ul items={[
          "Click the microphone button and speak — or type in the text box",
          "NOVA Help answers your question instantly",
          "Ask follow-up questions just like a conversation",
        ]} />
        <H3>Example Questions</H3>
        <Ul items={[
          '"What aisle is slot 25 in?"',
          '"How do I build a stable pallet?"',
          '"What does NOVA say when I confirm a pick?"',
          '"¿Cómo confirmo un pick?" (Spanish works too)',
        ]} />
      </div>

      {/* NOVA Trainer */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 mb-6">
        <H2>5. NOVA Trainer — Voice Simulation</H2>
        <P>Simulates the ES3 voice-directed picking system. Walks you through a full picking session using real commands and responses. Company plan only.</P>
        <H3>How to Start</H3>
        <Ul items={[
          "Go to NOVA Trainer in the menu",
          "Enter your NOVA ID (e.g. NOVA-25917) or select from the list",
          "Click Begin Session — NOVA starts automatically",
        ]} />
        <H3>Session Steps</H3>
        <TableWrap>
          <thead><tr><Th>Step</Th><Th>What NOVA Expects</Th></tr></thead>
          <tbody>
            {[
              ["Sign On","Your equipment number"],
              ["Confirm Equipment","Confirm the number NOVA repeats"],
              ["Max Pallet Count","How many pallets you can hold"],
              ["Safety Check","Answer 9 safety questions"],
              ["Load Picks",'Say "load picks" when ready'],
              ["Pick Summary","NOVA reads your assignments"],
              ["Setup Alpha / Bravo","Confirm your staging doors"],
              ["Pick Check","NOVA gives slot and quantity"],
              ["Pick Ready",'Say "ready" when pick is complete'],
              ["Complete","NOVA closes out each door"],
            ].map(([s,w])=>(
              <tr key={s}><TdY>{s}</TdY><Td>{w}</Td></tr>
            ))}
          </tbody>
        </TableWrap>
        <H3>Key Voice Commands</H3>
        <TableWrap>
          <thead><tr><Th>Say</Th><Th>When</Th></tr></thead>
          <tbody>
            {[
              ["Equipment number (e.g. zero one)","When asked for equipment"],
              ["Correct / Yes","To confirm"],
              ["No / Incorrect","To deny or repeat"],
              ["Load picks","When picks are ready"],
              ["Ready","When a pick is complete"],
              ["Stop","End the session"],
            ].map(([s,w])=>(
              <tr key={s}><TdY>{s}</TdY><Td>{w}</Td></tr>
            ))}
          </tbody>
        </TableWrap>
        <Note>If your microphone isn't working, use the text box at the bottom to type commands manually and click Send.</Note>
      </div>

      {/* Session Lock */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 mb-6">
        <H2>6. Session Lock</H2>
        <H3>To Lock</H3>
        <Ul items={["Click your avatar (top-right) → 🔒 Lock session","Or: Exit a NOVA Trainer session"]} />
        <H3>To Unlock</H3>
        <Ul items={["Enter your password on the lock screen and click Unlock","If you forgot your password, click Sign out instead"]} />
      </div>

      {/* Owner section */}
      <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-8 mb-6">
        <H2>7. Owner Admin Tools</H2>
        <H3>Control Center (/owner)</H3>
        <Ul items={[
          "Stats — Total subscribers, active users, sessions, banned users",
          "User Management — Search, filter, change roles, ban/unban, remove accounts",
          "Invite Management — Generate invite links by role",
          "Plan Control — Manage Personal and Company plan visibility",
          "Admin Movement Log — Audit log of all platform actions",
          "Handbook — This guide",
        ]} />
        <H3>Users & Access (/users-access)</H3>
        <Ul items={[
          "Create and manage user accounts directly",
          "View pending invites",
          "Manage NOVA access and active accounts",
        ]} />
        <Note>Control Center and Users & Access are only visible to the owner account. No other user — including Company subscribers — can see or access them.</Note>
        <H3>Inviting Users</H3>
        <Ul items={[
          "Go to Control Center → Invite Management",
          "Enter the person's full name and email",
          "Select their role (Selector, Trainer, or Supervisor)",
          "Click Generate Invite Link",
          "Copy the link and send it to them",
        ]} />
      </div>

      {/* Roles table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 mb-6">
        <H2>8. Roles & Plans at a Glance</H2>
        <H3>Roles</H3>
        <TableWrap>
          <thead><tr><Th>Role</Th><Th>Can Access</Th></tr></thead>
          <tbody>
            {[
              ["Selector","Training, NOVA Help, NOVA Trainer, Mistakes, Leaderboard, Selector Nation"],
              ["Trainer","Everything Selector has + Trainer Dashboard, Assignment Control, Slot Master, Warehouse Ref, Voice Commands"],
              ["Supervisor","Everything Trainer has + Supervisor Dashboard, Live Tracking"],
              ["Owner","Everything + Control Center + Users & Access"],
            ].map(([r,a])=>(
              <tr key={r}><TdY>{r}</TdY><Td>{a}</Td></tr>
            ))}
          </tbody>
        </TableWrap>
        <H3>Plans</H3>
        <TableWrap>
          <thead><tr><Th>Feature</Th><Th>Personal</Th><Th>Company</Th></tr></thead>
          <tbody>
            {[
              ["Training","✓","✓"],
              ["NOVA Help","✓","✓"],
              ["Common Mistakes","✓","✓"],
              ["Selector Nation","✓","✓"],
              ["NOVA Trainer","✗","✓"],
              ["Leaderboard","✗","✓"],
              ["Trainer Dashboard","✗","✓ (trainer role)"],
              ["Supervisor Dashboard","✗","✓ (supervisor role)"],
              ["Control Center","✗ (owner only)","✗ (owner only)"],
              ["Users & Access","✗ (owner only)","✗ (owner only)"],
            ].map(([f,p,c])=>(
              <tr key={f}>
                <Td>{f}</Td>
                <td className={`px-4 py-3 border-t border-slate-800 font-bold text-sm ${p==="✓"?"text-green-400":p.startsWith("✗")?"text-red-400":"text-slate-300"}`}>{p}</td>
                <td className={`px-4 py-3 border-t border-slate-800 font-bold text-sm ${c==="✓"||c.startsWith("✓")?"text-green-400":c.startsWith("✗")?"text-red-400":"text-slate-300"}`}>{c}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>

      <p className="text-center text-xs text-slate-600 pb-6">PickSmart Academy — Voice Training System</p>
    </div>
  );
}

// ── Link Library ──────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }
  return { copied, copy };
}

function LinkRow({
  label,
  description,
  url,
  icon: Icon,
  accent = "yellow",
  linkKey,
  copied,
  onCopy,
}: {
  label: string;
  description: string;
  url: string;
  icon: React.ElementType;
  accent?: "yellow" | "red" | "blue" | "green" | "purple";
  linkKey: string;
  copied: string | null;
  onCopy: (key: string, url: string) => void;
}) {
  const colors: Record<string, { border: string; bg: string; icon: string; btn: string; hover: string; text: string }> = {
    yellow: { border: "border-yellow-400/30", bg: "bg-yellow-400/5", icon: "bg-yellow-400/20 text-yellow-400", btn: "bg-yellow-400 text-slate-950 hover:bg-yellow-300", hover: "hover:border-yellow-400 hover:text-yellow-400", text: "text-yellow-300" },
    red:    { border: "border-red-500/30",    bg: "bg-red-500/5",    icon: "bg-red-500/20 text-red-400",    btn: "bg-red-500 text-white hover:bg-red-400",           hover: "hover:border-red-400 hover:text-red-400",     text: "text-red-300" },
    blue:   { border: "border-blue-500/30",   bg: "bg-blue-500/5",   icon: "bg-blue-500/20 text-blue-400",  btn: "bg-blue-500 text-white hover:bg-blue-400",         hover: "hover:border-blue-400 hover:text-blue-400",   text: "text-blue-300" },
    green:  { border: "border-green-500/30",  bg: "bg-green-500/5",  icon: "bg-green-500/20 text-green-400",btn: "bg-green-600 text-white hover:bg-green-500",       hover: "hover:border-green-400 hover:text-green-400", text: "text-green-300" },
    purple: { border: "border-purple-500/30", bg: "bg-purple-500/5", icon: "bg-purple-500/20 text-purple-400",btn:"bg-purple-600 text-white hover:bg-purple-500",    hover: "hover:border-purple-400 hover:text-purple-400",text: "text-purple-300" },
  };
  const c = colors[accent];
  const isCopied = copied === linkKey;

  return (
    <div className={`rounded-3xl border ${c.border} ${c.bg} p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-black text-white text-sm">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
        <p className={`flex-1 font-mono text-xs truncate ${c.text}`}>{url}</p>
        <button
          onClick={() => onCopy(linkKey, url)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition shrink-0 ${c.btn}`}
        >
          <Copy className="w-3.5 h-3.5" />
          {isCopied ? "Copied!" : "Copy"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition shrink-0 ${c.hover}`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open
        </a>
      </div>
    </div>
  );
}

function LinkLibrary() {
  const { copied, copy } = useCopy();
  const { customWarehouses } = useWarehouseStore();
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  const origin = window.location.origin;

  const url = (path: string) => `${origin}${base}${path}`;

  const allWarehouses = [...DEFAULT_WAREHOUSES, ...customWarehouses];

  const sections = [
    {
      title: "Owner Private",
      links: [
        { key: "magic",  label: "Owner Magic Link",  description: "Instantly log in as owner — keep this secret", url: url(`/owner-access?token=${OWNER_TOKEN}`), icon: Key,           accent: "red"    as const },
        { key: "owner",  label: "Owner Control Center", description: "Main owner dashboard — requires login",      url: url("/owner"),                               icon: LayoutDashboard, accent: "yellow" as const },
        { key: "users",  label: "Users & Access",    description: "Manage all accounts and invites",              url: url("/users-access"),                        icon: Users,         accent: "yellow" as const },
      ],
    },
    {
      title: "Public Pages",
      links: [
        { key: "home",    label: "Home Page",     description: "Public-facing landing page",         url: url("/"),          icon: Globe,   accent: "green"  as const },
        { key: "pricing", label: "Pricing Page",  description: "Pricing plans for new subscribers",  url: url("/pricing"),   icon: ShieldCheck, accent: "green" as const },
        { key: "privacy", label: "Privacy Policy", description: "Data protection & warehouse isolation policy", url: url("/privacy"), icon: ShieldCheck, accent: "green" as const },
        { key: "terms",   label: "Terms of Service", description: "Platform terms, acceptable use, subscriptions", url: url("/terms"), icon: ShieldCheck, accent: "green" as const },
      ],
    },
    {
      title: "Staff & Training",
      links: [
        { key: "training",  label: "Training Modules",       description: "All training content",            url: url("/training"),        icon: BookOpen, accent: "blue" as const },
        { key: "trainer",   label: "Trainer Dashboard",      description: "Trainer portal (trainer+ role)",  url: url("/trainer-portal"),  icon: Activity, accent: "blue" as const },
        { key: "nova",      label: "NOVA Trainer",           description: "Voice picking simulator (ES3 only)",  url: url("/nova-trainer"),    icon: Mic,      accent: "blue" as const },
        { key: "supervisor",label: "Supervisor Dashboard",   description: "Supervisor tools",                url: url("/supervisor"),      icon: ShieldCheck, accent: "purple" as const },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-white">Link Library</h2>
        <p className="text-sm text-slate-400 mt-1">All important URLs for the platform — copy or open in one click.</p>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">{section.title}</p>
          <div className="flex flex-col gap-3">
            {section.links.map((link) => (
              <LinkRow
                key={link.key}
                linkKey={link.key}
                label={link.label}
                description={link.description}
                url={link.url}
                icon={link.icon}
                accent={link.accent}
                copied={copied}
                onCopy={copy}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Warehouse Invite Links */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Warehouse Invite Links</p>
        <p className="text-xs text-slate-600 mb-3">
          Share these links with your warehouse team. ES3 links include NOVA Trainer. Standard links do not.
        </p>
        <div className="flex flex-col gap-3">
          {allWarehouses.map((wh) => {
            const warehouseUrl = url(`/w/${wh.slug}`);
            const isES3 = wh.systemType === "es3";
            return (
              <div
                key={wh.id}
                className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
                  isES3
                    ? "border-yellow-400/30 bg-yellow-400/5"
                    : "border-slate-700 bg-slate-900"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isES3 ? "bg-yellow-400/20" : "bg-slate-800"
                }`}>
                  <WarehouseIcon className={`w-4 h-4 ${isES3 ? "text-yellow-400" : "text-slate-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">{wh.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isES3
                        ? "bg-yellow-400/20 text-yellow-300"
                        : "bg-slate-700 text-slate-300"
                    }`}>
                      {SYSTEM_TYPE_LABEL[wh.systemType]}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-slate-800 text-slate-400">
                      {wh.allowedFeatures.length} features
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">{warehouseUrl}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copy(wh.id, warehouseUrl)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                      isES3
                        ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                        : "bg-slate-700 text-white hover:bg-slate-600"
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied === wh.id ? "Copied!" : "Copy"}
                  </button>
                  <a
                    href={warehouseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-yellow-400 hover:text-yellow-400 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Users & Access Tab ────────────────────────────────────────────────────────
type RoleKey = "Selector" | "Trainer" | "Supervisor" | "Admin" | "User";

const roleLinks: Record<RoleKey, string> = {
  Selector: "/nova",
  Trainer: "/trainer-portal",
  Supervisor: "/supervisor",
  Admin: "/owner",
  User: "/",
};

const roleDescriptions: Record<RoleKey, string> = {
  Selector: "selector access: Training · My Progress · Leaderboard · Common Mistakes · NOVA Trainer · Selector Nation",
  Trainer: "trainer access: Trainer Dashboard · My Selectors · Assignments · Warehouse Reference · NOVA tools",
  Supervisor: "supervisor access: Supervisor Dashboard · Live tracking · Warehouse Reference · Trainer oversight",
  Admin: "admin access: Full analytics · user management · NOVA account management",
  User: "user access: basic site access",
};

function maskPassword(password: string) {
  return "•".repeat(Math.max(password.length, 8));
}

const UA_ROLE_BADGE: Record<string, string> = {
  Selector: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  Trainer: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  Supervisor: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  Admin: "bg-red-500/10 text-red-300 border-red-500/30",
  User: "bg-slate-700 text-slate-300 border-slate-600",
};

const AUTH_ROLES: Record<RoleKey, AuthRole | null> = {
  Selector: null,
  Trainer: "trainer",
  Supervisor: "supervisor",
  Admin: "owner",
  User: null,
};

function UsersAccessSection() {
  const { currentUser, addInvite } = useAuthStore();
  const { appUsers, novaAccounts, inviteAppUser, createNovaAccount, deactivateNovaAccount } = useAccessStore();
  const { customWarehouses } = useWarehouseStore();
  const allWarehouses = [...DEFAULT_WAREHOUSES, ...customWarehouses];

  const [inviteForm, setInviteForm] = useState({
    fullName: "John Smith",
    email: "someone@example.com",
    role: "Selector" as RoleKey,
    warehouseSlug: allWarehouses[0]?.slug ?? "",
  });

  const [accountForm, setAccountForm] = useState({
    fullName: "Jane Smith",
    username: "jane.smith",
    password: "Secure2024!",
    role: "Trainer" as "Trainer" | "Supervisor",
  });

  const [copied, setCopied] = useState("");
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [generatedInviteName, setGeneratedInviteName] = useState("");
  const [generatedInviteEmail, setGeneratedInviteEmail] = useState("");
  const [generatedInviteRole, setGeneratedInviteRole] = useState<RoleKey>("Selector");
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const inviteLink = useMemo(() => roleLinks[inviteForm.role], [inviteForm.role]);

  const allowedRoles: RoleKey[] = useMemo(() => {
    const r = currentUser?.role;
    if (r === "owner" || r === "manager") return ["Selector", "Trainer", "Supervisor", "Admin"];
    return ["Selector", "Trainer"];
  }, [currentUser?.role]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1800);
    } catch { /* silent */ }
  };

  const handleInviteUser = () => {
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) return;
    inviteAppUser({ fullName: inviteForm.fullName, email: inviteForm.email, role: inviteForm.role, inviteLink });
    const authRole = AUTH_ROLES[inviteForm.role];
    const name = inviteForm.fullName.trim();
    const email = inviteForm.email.trim();
    const role = inviteForm.role;
    const selectedWarehouse = allWarehouses.find((w) => w.slug === inviteForm.warehouseSlug) ?? null;
    if (authRole) {
      const token = addInvite({
        fullName: name,
        email,
        role: authRole,
        warehouseId: selectedWarehouse?.id ?? null,
        warehouseSlug: selectedWarehouse?.slug ?? null,
      });
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const url = `${window.location.origin}${base}/invite/${token}`;
      setGeneratedInviteUrl(url);
      setGeneratedInviteName(name);
      setGeneratedInviteEmail(email);
      setGeneratedInviteRole(role);
    } else {
      setGeneratedInviteUrl(null);
    }
    setInviteForm({ fullName: "", email: "", role: "Selector", warehouseSlug: allWarehouses[0]?.slug ?? "" });
  };

  const handleSendEmail = () => {
    if (!generatedInviteUrl) return;
    const subject = encodeURIComponent("You've been invited to PickSmart Academy");
    const body = encodeURIComponent(
      `Hi ${generatedInviteName},\n\nYou've been invited to join PickSmart Academy as a ${generatedInviteRole}.\n\nClick the link below to create your account:\n\n${generatedInviteUrl}\n\nSee you on the floor!\n— PickSmart Academy`
    );
    window.open(`mailto:${generatedInviteEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  const handleShare = async () => {
    if (!generatedInviteUrl || !canShare) return;
    try {
      await navigator.share({
        title: "PickSmart Academy Invite",
        text: `You've been invited to PickSmart Academy as a ${generatedInviteRole}. Create your account here:`,
        url: generatedInviteUrl,
      });
    } catch { /* user cancelled */ }
  };

  const handleCreateAccount = () => {
    if (!accountForm.fullName.trim() || !accountForm.username.trim() || !accountForm.password.trim()) return;
    createNovaAccount({ fullName: accountForm.fullName, username: accountForm.username, password: accountForm.password, role: accountForm.role });
    setAccountForm({ fullName: "", username: "", password: "", role: "Trainer" });
  };

  return (
    <div className="space-y-8">

      {/* Copy toast */}
      {copied && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300 text-sm font-bold flex items-center gap-2">
          <Check className="h-4 w-4" /> Copied: {copied}
        </div>
      )}

      {/* Row 1 — Invite + App Users */}
      <div className="grid xl:grid-cols-2 gap-6">

        {/* Invite by Role */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-yellow-400" /> Invite by Role
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Full Name</label>
              <input
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm((p) => ({ ...p, fullName: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email Address</label>
              <input
                value={inviteForm.email}
                onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                type="email"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Role</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as RoleKey }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
              >
                {allowedRoles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Assign to Warehouse</label>
              <select
                value={inviteForm.warehouseSlug}
                onChange={(e) => setInviteForm((p) => ({ ...p, warehouseSlug: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
              >
                <option value="">— No warehouse assigned —</option>
                {allWarehouses.map((wh) => (
                  <option key={wh.id} value={wh.slug}>
                    {wh.name} ({wh.systemType === "es3" ? "ES3" : "Standard"})
                  </option>
                ))}
              </select>
              {inviteForm.warehouseSlug && (() => {
                const wh = allWarehouses.find((w) => w.slug === inviteForm.warehouseSlug);
                return wh ? (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {wh.allowedFeatures.length} features · {wh.systemType === "es3" ? "Includes NOVA Trainer" : "No NOVA Trainer"}
                  </p>
                ) : null;
              })()}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <p className="text-sm text-yellow-300 font-semibold leading-snug">
                {roleDescriptions[inviteForm.role]}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-300 break-all">
                  {window.location.origin}{inviteLink}
                </div>
                <button
                  onClick={() => handleCopy(inviteLink, "Invite URL")}
                  className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold hover:border-yellow-400 transition flex items-center gap-2 shrink-0"
                >
                  <Copy className="h-4 w-4" /> Copy
                </button>
              </div>
            </div>
            <button
              onClick={handleInviteUser}
              className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" /> Generate Invite Link
            </button>
            {generatedInviteUrl && (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 mt-2 space-y-4">
                <p className="text-green-300 text-sm font-bold flex items-center gap-2">
                  <Check className="h-4 w-4" /> Invite link ready for {generatedInviteName}
                </p>
                <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-300 break-all">
                  {generatedInviteUrl}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSendEmail}
                    className="flex-1 min-w-[140px] rounded-2xl bg-yellow-400 px-4 py-2.5 font-bold text-sm text-slate-950 hover:bg-yellow-300 transition flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" /> Send Email
                  </button>
                  {canShare && (
                    <button
                      onClick={handleShare}
                      className="flex-1 min-w-[120px] rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2.5 font-semibold text-sm text-white hover:border-yellow-400 transition flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(generatedInviteUrl, "Invite URL")}
                    className="flex-1 min-w-[120px] rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2.5 font-semibold text-sm text-white hover:border-yellow-400 transition flex items-center justify-center gap-2"
                  >
                    {copied === "Invite URL"
                      ? <><Check className="h-4 w-4 text-green-400" /> Copied!</>
                      : <><Copy className="h-4 w-4" /> Copy Link</>}
                  </button>
                </div>
                <p className="text-xs text-green-400/70">
                  "Send Email" opens your email app pre-filled with {generatedInviteEmail} and the invite link.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* App Users */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-yellow-400" /> App Users
          </h2>
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            {appUsers.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h3 className="text-base font-black capitalize">{user.fullName}</h3>
                <p className="mt-1 text-slate-400 text-sm">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold border ${UA_ROLE_BADGE[user.role] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                    {user.role}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                    user.status === "active"
                      ? "bg-green-500/10 text-green-300 border-green-500/30"
                      : user.status === "invited"
                      ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                      : "bg-slate-700 text-slate-400 border-slate-600"
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 — NOVA Accounts */}
      <div className="grid xl:grid-cols-2 gap-6">

        {/* Create NOVA Account */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
            <Key className="h-5 w-5 text-yellow-400" /> NOVA Access
          </h2>
          <p className="text-slate-400 text-sm mb-6">Trainers &amp; Supervisors</p>
          <p className="text-base font-bold mb-5">Create new account</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Full name</label>
              <input
                value={accountForm.fullName}
                onChange={(e) => setAccountForm((p) => ({ ...p, fullName: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Username</label>
                <input
                  value={accountForm.username}
                  onChange={(e) => setAccountForm((p) => ({ ...p, username: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Password</label>
                <input
                  value={accountForm.password}
                  onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Role</label>
              <select
                value={accountForm.role}
                onChange={(e) => setAccountForm((p) => ({ ...p, role: e.target.value as "Trainer" | "Supervisor" }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition"
              >
                <option>Trainer</option>
                <option>Supervisor</option>
              </select>
            </div>
            <button
              onClick={handleCreateAccount}
              className="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition"
            >
              Create account
            </button>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trainers log in at <span className="text-slate-300">/trainer-portal</span> and supervisors at{" "}
              <span className="text-slate-300">/supervisor</span> using these credentials.
            </p>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-6">Active accounts</h2>
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {novaAccounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black capitalize">{account.fullName}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold border ${UA_ROLE_BADGE[account.role] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                        {account.role}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                        account.status === "active"
                          ? "bg-green-500/10 text-green-300 border-green-500/30"
                          : "bg-red-500/10 text-red-300 border-red-500/30"
                      }`}>
                        {account.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Username: <span className="text-white font-semibold">{account.username}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Password: <span className="text-white font-semibold">{maskPassword(account.password)}</span>
                    </p>
                  </div>
                  {account.status === "active" && (
                    <button
                      onClick={() => deactivateNovaAccount(account.id)}
                      className="rounded-2xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Revenue Tab ───────────────────────────────────────────────────────────────
interface CompanyClient {
  id: string;
  name: string;
  email: string;
  status: "active" | "pending" | "cancelled";
  weeklyRate: number;
  startDate: string;
}

const INITIAL_CLIENTS: CompanyClient[] = [
  { id: "c1", name: "ES3 Lancaster", email: "ops@es3lancaster.com", status: "active", weeklyRate: 1660, startDate: "Jan 2025" },
  { id: "c2", name: "Dallas Warehouse DC", email: "manager@dallaswh.com", status: "active", weeklyRate: 1660, startDate: "Feb 2025" },
  { id: "c3", name: "Chicago Distribution", email: "admin@chicagodc.com", status: "pending", weeklyRate: 1660, startDate: "—" },
];

function RevenueTab() {
  const [clients, setClients] = useState<CompanyClient[]>(INITIAL_CLIENTS);
  const [form, setForm]       = useState({ name: "", email: "", weeklyRate: 1660 });
  const [showForm, setShowForm] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<Record<string, "loading" | "sent" | "error">>({});

  const activeClients  = clients.filter((c) => c.status === "active");
  const pendingClients = clients.filter((c) => c.status === "pending");
  const weeklyRevenue  = activeClients.reduce((s, c) => s + c.weeklyRate, 0);

  const statusBadge = (s: CompanyClient["status"]) => {
    if (s === "active")    return "bg-green-500/15 text-green-300 border-green-500/30";
    if (s === "pending")   return "bg-yellow-400/15 text-yellow-300 border-yellow-400/30";
    return "bg-red-500/15 text-red-300 border-red-500/30";
  };

  const sendInvoice = async (client: CompanyClient) => {
    setInvoiceStatus((p) => ({ ...p, [client.id]: "loading" }));
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: client.name, email: client.email, weeklyRate: client.weeklyRate }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "No URL returned");
      window.open(data.url, "_blank");
      setInvoiceStatus((p) => ({ ...p, [client.id]: "sent" }));
      setTimeout(() => setInvoiceStatus((p) => { const n = { ...p }; delete n[client.id]; return n; }), 4000);
    } catch (err) {
      console.error("[Revenue] sendInvoice:", err);
      setInvoiceStatus((p) => ({ ...p, [client.id]: "error" }));
      setTimeout(() => setInvoiceStatus((p) => { const n = { ...p }; delete n[client.id]; return n; }), 4000);
    }
  };

  const addClient = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setClients((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        name: form.name.trim(),
        email: form.email.trim(),
        status: "pending",
        weeklyRate: form.weeklyRate,
        startDate: "—",
      },
    ]);
    setForm({ name: "", email: "", weeklyRate: 1660 });
    setShowForm(false);
  };

  return (
    <div className="space-y-8">

      {/* Stripe key notice */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-5 py-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-300">Stripe setup required to send live invoices</p>
          <p className="text-xs text-blue-400/70 mt-1">
            Add <code className="bg-slate-800 px-1 rounded">STRIPE_SECRET_KEY</code>,{" "}
            <code className="bg-slate-800 px-1 rounded">STRIPE_WEBHOOK_SECRET</code>, and{" "}
            <code className="bg-slate-800 px-1 rounded">APP_URL</code> to your environment variables.
            The Send Invoice button will open the Stripe checkout page for your client once configured.
          </p>
        </div>
      </div>

      {/* Revenue summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-yellow-400" />
            <p className="text-xs text-slate-500 uppercase tracking-widest">Weekly Revenue</p>
          </div>
          <p className="text-3xl font-black text-yellow-400">
            ${weeklyRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-slate-600 mt-1">{activeClients.length} active client{activeClients.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-slate-500 uppercase tracking-widest">Active Clients</p>
          </div>
          <p className="text-3xl font-black text-white">{activeClients.length}</p>
          <p className="text-xs text-slate-600 mt-1">${(weeklyRevenue * 4).toLocaleString()} / month est.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-blue-400" />
            <p className="text-xs text-slate-500 uppercase tracking-widest">Pending</p>
          </div>
          <p className="text-3xl font-black text-white">{pendingClients.length}</p>
          <p className="text-xs text-slate-600 mt-1">awaiting first payment</p>
        </div>
      </div>

      {/* Client list */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Building2 className="h-5 w-5 text-yellow-400" />
            Company Clients
          </h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-yellow-300 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Client
          </button>
        </div>

        {/* Add client form */}
        {showForm && (
          <div className="mb-5 rounded-2xl border border-yellow-400/20 bg-slate-950 p-5 space-y-3">
            <p className="text-sm font-bold text-yellow-400">New Client</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Company name"
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm focus:border-yellow-400 focus:outline-none"
              />
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Billing email"
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm focus:border-yellow-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Rate $</span>
                <input
                  type="number"
                  value={form.weeklyRate}
                  onChange={(e) => setForm((p) => ({ ...p, weeklyRate: Number(e.target.value) }))}
                  className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm focus:border-yellow-400 focus:outline-none"
                />
                <span className="text-sm text-slate-500">/week</span>
              </div>
              <button
                onClick={addClient}
                className="rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-yellow-300 transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Client rows */}
        <div className="space-y-3">
          {clients.map((client) => {
            const invStatus = invoiceStatus[client.id];
            return (
              <div
                key={client.id}
                className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white">{client.name}</p>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusBadge(client.status)}`}>
                      {client.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{client.email} · Since {client.startDate}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-black text-yellow-400">${client.weeklyRate.toLocaleString()}</p>
                    <p className="text-xs text-slate-600">per week</p>
                  </div>

                  <button
                    onClick={() => sendInvoice(client)}
                    disabled={invStatus === "loading"}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                      invStatus === "sent"
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : invStatus === "error"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                    } disabled:opacity-50`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {invStatus === "loading" ? "Sending…"
                      : invStatus === "sent"  ? "Sent!"
                      : invStatus === "error" ? "Failed"
                      : "Send Invoice"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-lg font-black mb-4">How Invoice Payments Work</h3>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { n: "1", title: "Click Send Invoice", body: "Opens a Stripe payment page for the client's weekly subscription." },
            { n: "2", title: "Client Pays Online",   body: "Client enters their card. Stripe handles billing, receipts, and retries." },
            { n: "3", title: "Auto Confirmation",    body: "Stripe sends receipt + invoice directly to the client's email." },
            { n: "4", title: "Account Activated",    body: "Webhook fires on payment — company account gets marked as subscribed." },
          ].map(({ n, title, body }) => (
            <div key={n} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="h-7 w-7 rounded-full bg-yellow-400/20 flex items-center justify-center mb-3">
                <span className="text-xs font-black text-yellow-400">{n}</span>
              </div>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── Subscriptions Tab ─────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const { requests, approveRequest, rejectRequest } = useCompanyRequestStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const pending = requests.filter((r) => r.status === "pending_approval" || r.status === "pending_onboarding");
  const resolved = requests.filter((r) => r.status === "approved" || r.status === "rejected");

  function statusBadge(status: CompanyRequest["status"]) {
    if (status === "pending_approval")  return <span className="rounded-full bg-yellow-400/15 px-2.5 py-1 text-xs font-bold text-yellow-400">Pending Approval</span>;
    if (status === "pending_onboarding") return <span className="rounded-full bg-blue-400/15 px-2.5 py-1 text-xs font-bold text-blue-400">Awaiting Onboarding</span>;
    if (status === "approved")          return <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-400">Approved</span>;
    if (status === "rejected")          return <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400">Rejected</span>;
    return null;
  }

  function RequestCard({ req }: { req: CompanyRequest }) {
    const open = expanded === req.id;
    const note = noteMap[req.id] ?? "";
    const isPending = req.status === "pending_approval";
    const submitted = new Date(req.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
      <div className={`rounded-2xl border bg-slate-900 overflow-hidden transition ${
        isPending ? "border-yellow-400/30" : "border-slate-700"
      }`}>
        {/* Card header */}
        <div
          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
          onClick={() => setExpanded(open ? null : req.id)}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="font-black text-white text-base">{req.companyName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{req.contactName} · {req.contactEmail}</p>
              <p className="text-xs text-slate-600 mt-0.5">Submitted {submitted}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {statusBadge(req.status)}
            <div className="text-right">
              <p className="font-black text-white">{req.totalLabel}</p>
              <p className="text-xs text-slate-500">{req.contractLabel} contract</p>
            </div>
            {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </div>
        </div>

        {/* Expanded details */}
        {open && (
          <div className="border-t border-slate-800 p-5 space-y-5">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={req.contactPhone || "—"} />
              <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Contract" value={`${req.contractLabel} — ${req.totalLabel}`} />
              <InfoRow icon={<Users className="h-3.5 w-3.5" />} label="Requested Users" value={req.userCount ? `${req.userCount} users` : "Not set yet"} />
            </div>

            {req.trainers && req.trainers.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Trainers</p>
                <div className="space-y-2">
                  {req.trainers.map((t, i) => (
                    <div key={i} className="flex flex-wrap gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm">
                      <span className="font-semibold text-white">{t.name}</span>
                      <span className="text-slate-400">{t.email}</span>
                      <span className="text-slate-500">{t.profession}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {req.supervisors && req.supervisors.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Supervisors & Managers</p>
                <div className="space-y-2">
                  {req.supervisors.map((s, i) => (
                    <div key={i} className="flex flex-wrap gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm">
                      <span className="font-semibold text-white">{s.name}</span>
                      <span className="text-slate-400">{s.email}</span>
                      <span className="text-slate-500">{s.profession}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {req.additionalNotes && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Notes from Company</p>
                <p className="text-sm text-slate-300 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">{req.additionalNotes}</p>
              </div>
            )}

            {isPending && (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-2">Your note to the company (optional)</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNoteMap((m) => ({ ...m, [req.id]: e.target.value }))}
                    placeholder="e.g. Payment confirmed via wire transfer. Access being set up…"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400 resize-none placeholder:text-slate-600"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => approveRequest(req.id, note)}
                    className="flex-1 rounded-xl bg-green-500 py-2.5 font-bold text-white hover:bg-green-400 transition flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4" /> Approve & Grant Access
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id, note)}
                    className="flex-1 rounded-xl border border-red-500/40 bg-red-500/10 py-2.5 font-bold text-red-400 hover:bg-red-500/20 transition flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            )}

            {(req.status === "approved" || req.status === "rejected") && req.ownerNote && (
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Your Note</p>
                <p className="text-sm text-slate-300 italic">{req.ownerNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Company Subscription Requests</h2>
          <p className="text-slate-400 text-sm mt-1">
            Incoming requests from companies wanting access. Review, then approve or reject each one.
          </p>
        </div>
        {pending.length > 0 && (
          <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-black text-slate-950">
            {pending.length} pending
          </span>
        )}
      </div>

      {requests.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-500">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No subscription requests yet</p>
          <p className="text-sm mt-1">Requests will appear here when companies submit from the checkout page.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Action Required</p>
          {pending.map((r) => <RequestCard key={r.id} req={r} />)}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Resolved</p>
          {resolved.map((r) => <RequestCard key={r.id} req={r} />)}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-semibold text-white text-sm">{value}</p>
      </div>
    </div>
  );
}

// ── Talk Requests Inbox ───────────────────────────────────────────────────────
function TalkRequestsSection() {
  const { requests, markRead, markResolved, deleteRequest } = useTalkRequestStore();
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "resolved">("all");

  const filtered = requests.filter((r) => filter === "all" || r.status === filter);
  const unreadCount = requests.filter((r) => r.status === "unread").length;

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
      });
    } catch {
      return iso;
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    unread: "bg-yellow-400/20 text-yellow-300",
    read: "bg-slate-700 text-slate-300",
    resolved: "bg-green-500/20 text-green-300",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-yellow-400" />
            Talk Requests Inbox
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Visitors and customers who requested to speak with you from the NOVA Help page.
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-black text-slate-950">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {(["all", "unread", "read", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition capitalize ${
              filter === f
                ? "bg-yellow-400 text-slate-950"
                : "border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
            }`}
          >
            {f === "all" ? `All (${requests.length})` : f === "unread" ? `Unread (${unreadCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-500">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No requests yet</p>
          <p className="text-sm mt-1">
            {filter === "all"
              ? "Talk requests from NOVA Help will appear here."
              : `No ${filter} requests.`}
          </p>
        </div>
      )}

      {/* Request cards */}
      <div className="space-y-4">
        {filtered.map((req) => (
          <div
            key={req.id}
            className={`rounded-3xl border bg-slate-900 p-6 transition-all ${
              req.status === "unread"
                ? "border-yellow-400/40"
                : req.status === "resolved"
                ? "border-green-500/20 opacity-75"
                : "border-slate-800"
            }`}
          >
            {/* Card header */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-lg font-black text-white">{req.name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[req.status]}`}>
                    {req.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {formatDate(req.createdAt)}
                </div>
              </div>
              <button
                onClick={() => { if (confirm("Delete this request?")) deleteRequest(req.id); }}
                className="text-slate-600 hover:text-red-400 transition p-1"
                title="Delete request"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contact details */}
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <a
                  href={`mailto:${req.email}`}
                  className="text-sm font-semibold text-yellow-400 hover:underline"
                >
                  {req.email}
                </a>
              </div>
              {req.phone && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Phone</p>
                  <a
                    href={`tel:${req.phone}`}
                    className="text-sm font-semibold text-white hover:text-yellow-400 transition"
                  >
                    {req.phone}
                  </a>
                </div>
              )}
              {req.company && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Company / Warehouse</p>
                  <p className="text-sm font-semibold text-white">{req.company}</p>
                </div>
              )}
            </div>

            {/* Topic */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4 mb-5">
              <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">What they want to discuss</p>
              <p className="text-slate-200 text-sm leading-relaxed">{req.topic}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {req.status === "unread" && (
                <button
                  onClick={() => markRead(req.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition"
                >
                  Mark as Read
                </button>
              )}
              {req.status !== "resolved" && (
                <button
                  onClick={() => markResolved(req.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-green-500/20 border border-green-500/30 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/30 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Resolved
                </button>
              )}
              <a
                href={`mailto:${req.email}?subject=PickSmart Academy - Following up on your request`}
                className="flex items-center gap-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/30 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/20 transition"
              >
                <Mail className="h-4 w-4" />
                Reply via Email
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CRM Section ───────────────────────────────────────────────────────────────
const EMPTY_LEAD_FORM = {
  companyName: "", contactName: "", contactRole: "", email: "", phone: "",
  city: "", state: "", warehouseType: "", status: "new_lead" as LeadStatus,
  nextAction: "", nextActionDate: "", notes: "",
  contractValue: "", weeklyPrice: "",
  demoDate: "", proposalDate: "", trialStart: "", trialEnd: "",
  contractSigned: "", renewalDate: "",
};

const today = () => new Date().toISOString().slice(0, 10);
const diffDays = (a: string | null, b: string | null) => {
  if (!a || !b) return null;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
};

function CRMSection() {
  const { leads, loading, fetchLeads, addLead, updateStatus, deleteLead, updateLead } = useLeadStore();
  const [form, setForm] = useState({ ...EMPTY_LEAD_FORM });
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [saveMsg, setSaveMsg] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { fetchLeads(); }, []);

  function field(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const metrics = useMemo(() => {
    const won    = leads.filter((l) => l.status === "closed_won" || l.status === "active_client").length;
    const demos  = leads.filter((l) => l.status === "demo_booked").length;
    const trial  = leads.filter((l) => l.status === "trial_live").length;
    const pipeline = leads.reduce((s, l) => s + (l.contractValue ? Number(l.contractValue) : 0), 0);
    return { total: leads.length, demos, trial, won, pipeline };
  }, [leads]);

  const alerts = useMemo(() => {
    const td = today();
    const followups = leads.filter((l) => l.nextActionDate === td);
    const closing   = leads.filter((l) => {
      const d = diffDays(td, l.trialEnd);
      return d !== null && d >= 0 && d <= 3;
    });
    const renewals  = leads.filter((l) => {
      const d = diffDays(td, l.renewalDate);
      return d !== null && d >= 0 && d <= 14;
    });
    return { followups, closing, renewals };
  }, [leads]);

  async function handleSave() {
    if (!form.companyName.trim()) { setSaveMsg("Company name is required."); return; }
    try {
      const payload = {
        ...form,
        contractValue: form.contractValue ? form.contractValue : null,
        weeklyPrice:   form.weeklyPrice   ? form.weeklyPrice   : null,
        nextActionDate: form.nextActionDate || null,
        demoDate:       form.demoDate       || null,
        proposalDate:   form.proposalDate   || null,
        trialStart:     form.trialStart     || null,
        trialEnd:       form.trialEnd       || null,
        contractSigned: form.contractSigned || null,
        renewalDate:    form.renewalDate    || null,
      };
      if (editId) {
        await updateLead(editId, payload as Parameters<typeof updateLead>[1]);
        setEditId(null);
        setSaveMsg("Lead updated.");
      } else {
        await addLead(payload as Parameters<typeof addLead>[0]);
        setSaveMsg("Lead saved.");
      }
      setForm({ ...EMPTY_LEAD_FORM });
    } catch {
      setSaveMsg("Error saving lead.");
    }
    setTimeout(() => setSaveMsg(""), 3000);
  }

  function startEdit(lead: Lead) {
    setForm({
      companyName:    lead.companyName,
      contactName:    lead.contactName,
      contactRole:    lead.contactRole,
      email:          lead.email,
      phone:          lead.phone,
      city:           lead.city,
      state:          lead.state,
      warehouseType:  lead.warehouseType,
      status:         lead.status,
      nextAction:     lead.nextAction,
      nextActionDate: lead.nextActionDate ?? "",
      notes:          lead.notes,
      contractValue:  lead.contractValue ?? "",
      weeklyPrice:    lead.weeklyPrice ?? "",
      demoDate:       lead.demoDate ?? "",
      proposalDate:   lead.proposalDate ?? "",
      trialStart:     lead.trialStart ?? "",
      trialEnd:       lead.trialEnd ?? "",
      contractSigned: lead.contractSigned ?? "",
      renewalDate:    lead.renewalDate ?? "",
    });
    setEditId(lead.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function copyDealLink(id: string) {
    const url = `${window.location.origin}/deal-sign/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const InputField = ({ label, value, onChange, placeholder = "", type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
  }) => (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
      />
    </div>
  );

  const TextAreaField = ({ label, value, onChange, placeholder = "" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  }) => (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition resize-none"
      />
    </div>
  );

  return (
    <div className="space-y-8">

      {/* ── Alert Dashboard ── */}
      {(alerts.followups.length > 0 || alerts.closing.length > 0 || alerts.renewals.length > 0) && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { title: "🔔 Follow Up Today", list: alerts.followups, border: "border-blue-500/30 bg-blue-500/5" },
            { title: "📅 Closing Soon (≤3 days)", list: alerts.closing, border: "border-orange-500/30 bg-orange-500/5" },
            { title: "💰 Renewals (≤14 days)", list: alerts.renewals, border: "border-yellow-400/30 bg-yellow-400/5" },
          ].map((card) => card.list.length > 0 && (
            <div key={card.title} className={`rounded-2xl border p-4 ${card.border}`}>
              <p className="font-black text-sm mb-2">{card.title}</p>
              {card.list.map((l) => (
                <div key={l.id} className="text-sm text-slate-300 py-0.5">{l.companyName}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Pipeline Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Leads",    value: metrics.total,                         icon: <Briefcase className="h-4 w-4 text-slate-400" /> },
          { label: "Demos Booked",   value: metrics.demos,                         icon: <BarChart3 className="h-4 w-4 text-violet-400" /> },
          { label: "Trials Live",    value: metrics.trial,                         icon: <Activity className="h-4 w-4 text-yellow-400" /> },
          { label: "Won/Active",     value: metrics.won,                           icon: <CheckCircle2 className="h-4 w-4 text-green-400" /> },
          { label: "Pipeline Value", value: `$${metrics.pipeline.toLocaleString()}`, icon: <DollarSign className="h-4 w-4 text-green-300" /> },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-2">{m.icon}<p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{m.label}</p></div>
            <p className="text-2xl font-black text-white">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">

        {/* ── Add / Edit Lead Form ── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            {editId ? <><Edit3 className="h-5 w-5 text-yellow-400" /> Edit Lead</> : <><Plus className="h-5 w-5 text-yellow-400" /> Add Lead or Deal</>}
          </h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <InputField label="Company Name *" value={form.companyName} onChange={(v) => field("companyName", v)} />
            <InputField label="Contact Name" value={form.contactName} onChange={(v) => field("contactName", v)} />
            <InputField label="Contact Role" value={form.contactRole} onChange={(v) => field("contactRole", v)} placeholder="Operations Manager" />
            <InputField label="Email" value={form.email} onChange={(v) => field("email", v)} />
            <InputField label="Phone" value={form.phone} onChange={(v) => field("phone", v)} />
            <InputField label="City" value={form.city} onChange={(v) => field("city", v)} />
            <InputField label="State" value={form.state} onChange={(v) => field("state", v)} />
            <InputField label="Warehouse Type" value={form.warehouseType} onChange={(v) => field("warehouseType", v)} placeholder="Grocery DC / 3PL / Cold Storage" />
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => field("status", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <InputField label="Weekly Price ($)" value={form.weeklyPrice} onChange={(v) => field("weeklyPrice", v)} placeholder="1660" />
            <InputField label="Contract Value ($)" value={form.contractValue} onChange={(v) => field("contractValue", v)} placeholder="69000" />
            <InputField label="Next Action Date" value={form.nextActionDate} onChange={(v) => field("nextActionDate", v)} type="date" />
          </div>

          <p className="text-xs font-black text-slate-500 uppercase tracking-widest pt-2">Deal Timeline</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <InputField label="Demo Date" value={form.demoDate} onChange={(v) => field("demoDate", v)} type="date" />
            <InputField label="Proposal Date" value={form.proposalDate} onChange={(v) => field("proposalDate", v)} type="date" />
            <InputField label="Trial Start" value={form.trialStart} onChange={(v) => field("trialStart", v)} type="date" />
            <InputField label="Trial End" value={form.trialEnd} onChange={(v) => field("trialEnd", v)} type="date" />
            <InputField label="Contract Signed" value={form.contractSigned} onChange={(v) => field("contractSigned", v)} type="date" />
            <InputField label="Renewal Date" value={form.renewalDate} onChange={(v) => field("renewalDate", v)} type="date" />
          </div>

          <TextAreaField label="Next Action" value={form.nextAction} onChange={(v) => field("nextAction", v)} placeholder="Call Thursday, send demo PDF, follow up after trial." />
          <TextAreaField label="Notes" value={form.notes} onChange={(v) => field("notes", v)} placeholder="Pain points, objections, what happened in the visit." />

          {saveMsg && <p className="text-sm text-yellow-300">{saveMsg}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 font-black text-slate-950 hover:bg-yellow-300 transition"
            >
              <Send className="h-4 w-4" />
              {editId ? "Update Lead" : "Save Lead"}
            </button>
            <button
              onClick={() => { setForm({ ...EMPTY_LEAD_FORM }); setEditId(null); }}
              className="rounded-xl border border-slate-700 px-5 py-2.5 font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* ── Sales Handbook ── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-yellow-400" /> Sales Handbook
          </h2>
          <div className="space-y-3">
            {HANDBOOK_SECTIONS.map((section) => (
              <div key={section.title} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-2">{section.title}</p>
                <p className="text-sm text-slate-200 leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lead Pipeline ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-400" /> Pipeline ({filtered.length})
            {loading && <span className="text-xs text-slate-500 font-normal ml-1">loading…</span>}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === "all" ? "bg-yellow-400 text-slate-950" : "border border-slate-700 text-slate-400 hover:text-white"}`}
            >
              All ({leads.length})
            </button>
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setFilter(o.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === o.value ? "bg-yellow-400 text-slate-950" : "border border-slate-700 text-slate-400 hover:text-white"}`}
              >
                {o.label} ({leads.filter((l) => l.status === o.value).length})
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No leads yet</p>
            <p className="text-sm mt-1">Add your first lead or deal above.</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((lead) => {
            const isExpanded = expandedId === lead.id;
            const dealUrl = `${window.location.origin}/deal-sign/${lead.id}`;
            return (
              <div key={lead.id} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                {/* Row header */}
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <ChevronRight className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    <div className="min-w-0">
                      <p className="font-black text-white truncate">{lead.companyName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lead.contactName}{lead.contactRole ? ` · ${lead.contactRole}` : ""}
                        {lead.city ? ` · ${lead.city}${lead.state ? `, ${lead.state}` : ""}` : ""}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {lead.contractValue ? (
                      <span className="text-sm font-black text-green-300">${Number(lead.contractValue).toLocaleString()}</span>
                    ) : null}
                    {lead.status === "active_client" && (
                      <span className="rounded-full bg-green-400/20 px-2.5 py-0.5 text-xs font-black text-green-300">✅ Active</span>
                    )}
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-yellow-400 transition"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <a
                      href={`/deal/${lead.id}`}
                      className="rounded-xl border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:border-yellow-400/50 hover:text-yellow-300 transition"
                    >
                      Deal
                    </a>
                    <button
                      onClick={() => startEdit(lead)}
                      className="rounded-xl border border-slate-700 p-1.5 text-slate-400 hover:border-yellow-400/50 hover:text-yellow-300 transition"
                      title="Edit"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete ${lead.companyName}?`)) deleteLead(lead.id); }}
                      className="rounded-xl border border-slate-700 p-1.5 text-slate-500 hover:border-red-500/50 hover:text-red-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-800 px-5 py-4 space-y-3 bg-slate-950/50">
                    <div className="grid sm:grid-cols-3 gap-3 text-sm">
                      {lead.email && (
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Email</p>
                          <a href={`mailto:${lead.email}`} className="text-yellow-400 hover:underline font-semibold">{lead.email}</a>
                        </div>
                      )}
                      {lead.phone && (
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                          <a href={`tel:${lead.phone}`} className="text-white font-semibold hover:text-yellow-400 transition">{lead.phone}</a>
                        </div>
                      )}
                      {lead.warehouseType && (
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Warehouse Type</p>
                          <p className="text-white font-semibold">{lead.warehouseType}</p>
                        </div>
                      )}
                      {lead.weeklyPrice && (
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Weekly Price</p>
                          <p className="text-green-300 font-black">${Number(lead.weeklyPrice).toLocaleString()}/wk</p>
                        </div>
                      )}
                    </div>

                    {/* Timeline badges */}
                    <div className="flex flex-wrap gap-2">
                      {lead.demoDate       && <span className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-2 py-1 text-xs text-violet-300">Demo: {lead.demoDate}</span>}
                      {lead.trialStart     && <span className="rounded-lg bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 text-xs text-yellow-300">Trial: {lead.trialStart} → {lead.trialEnd ?? "?"}</span>}
                      {lead.contractSigned && <span className="rounded-lg bg-green-500/10 border border-green-500/20 px-2 py-1 text-xs text-green-300">Signed: {lead.contractSigned}</span>}
                      {lead.renewalDate    && <span className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-2 py-1 text-xs text-orange-300">Renewal: {lead.renewalDate}</span>}
                      {lead.signedBy       && <span className="rounded-lg bg-green-400/10 border border-green-400/20 px-2 py-1 text-xs text-green-200">✍ {lead.signedBy}</span>}
                    </div>

                    {/* Deal link */}
                    <div className="flex items-center gap-2">
                      <input
                        value={dealUrl}
                        readOnly
                        className="flex-1 rounded-xl border border-slate-700 bg-black px-3 py-2 text-xs text-slate-400 focus:outline-none"
                      />
                      <button
                        onClick={() => copyDealLink(lead.id)}
                        className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-yellow-400/50 hover:text-yellow-300 transition"
                      >
                        {copiedId === lead.id ? "Copied!" : "Copy Link"}
                      </button>
                      <a
                        href={`/deal-sign/${lead.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-yellow-400/30 px-3 py-2 text-xs font-bold text-yellow-300 hover:bg-yellow-400/10 transition"
                      >
                        Preview
                      </a>
                    </div>

                    {lead.nextAction && (
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Next Action {lead.nextActionDate ? `· ${lead.nextActionDate}` : ""}</p>
                        <p className="text-sm text-slate-200">{lead.nextAction}</p>
                      </div>
                    )}
                    {lead.notes && (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{lead.notes}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-600">
                      Added {new Date(lead.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Lesson Videos Manager ─────────────────────────────────────────────────────
const MODULE_META: { id: string; label: string; icon: string; searchQuery: string }[] = [
  { id: "mod-1", label: "Mod 1 — Beginner Basics", icon: "📦", searchQuery: "warehouse order picking training beginner" },
  { id: "mod-2", label: "Mod 2 — Warehouse Safety", icon: "🦺", searchQuery: "warehouse safety training injury prevention" },
  { id: "mod-3", label: "Mod 3 — Pallet Building", icon: "🏗️", searchQuery: "pallet building stacking warehouse tutorial" },
  { id: "mod-4", label: "Mod 4 — Pick Path Optimization", icon: "🗺️", searchQuery: "warehouse pick path efficiency speed" },
  { id: "mod-5", label: "Mod 5 — Performance & Pace", icon: "⚡", searchQuery: "warehouse performance rate tracking selector" },
  { id: "mod-6", label: "Mod 6 — Real Shift Simulation", icon: "🎧", searchQuery: "voice picking warehouse headset simulation" },
];

function LessonVideosSection() {
  const { overrides, setOverride, removeOverride } = useLessonVideoStore();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  function handleSave(moduleId: string) {
    const raw = (inputs[moduleId] ?? "").trim();
    if (!raw) {
      removeOverride(moduleId);
      setSaved((s) => ({ ...s, [moduleId]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [moduleId]: false })), 2000);
      return;
    }
    const id = extractYoutubeId(raw);
    if (!id) {
      setErrors((e) => ({ ...e, [moduleId]: "Not a valid YouTube URL or video ID." }));
      return;
    }
    setErrors((e) => ({ ...e, [moduleId]: "" }));
    setOverride(moduleId, id);
    setInputs((v) => ({ ...v, [moduleId]: "" }));
    setSaved((s) => ({ ...s, [moduleId]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [moduleId]: false })), 2500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Youtube className="h-6 w-6 text-red-400" />
          Lesson Demo Videos
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Paste a YouTube video URL or ID for each module. The video will appear at the bottom of that lesson page. Leave blank to show the search fallback.
        </p>
      </div>

      <div className="space-y-4">
        {MODULE_META.map((mod) => {
          const override = overrides[mod.id];
          const currentId = override?.youtubeId ?? LESSON_VIDEO_MAP[mod.id]?.youtubeId ?? "";
          const hasVideo = !!currentId;
          const isOwnerSet = !!override?.youtubeId;

          return (
            <div key={mod.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-lg font-black">
                    {mod.icon} {mod.label}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {hasVideo ? (
                      <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-bold text-green-300">
                        Video assigned {isOwnerSet ? "(custom)" : "(default)"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-bold text-slate-400">
                        No video — shows search link
                      </span>
                    )}
                  </div>
                </div>
                {hasVideo && (
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://www.youtube.com/watch?v=${currentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-red-500/50 hover:text-red-300 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview
                    </a>
                    {isOwnerSet && (
                      <button
                        onClick={() => removeOverride(mod.id)}
                        className="text-slate-600 hover:text-red-400 transition p-1.5"
                        title="Remove video"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Current video thumbnail */}
              {hasVideo && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-800">
                  <img
                    src={`https://img.youtube.com/vi/${currentId}/mqdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <input
                  value={inputs[mod.id] ?? ""}
                  onChange={(e) => {
                    setInputs((v) => ({ ...v, [mod.id]: e.target.value }));
                    setErrors((err) => ({ ...err, [mod.id]: "" }));
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(mod.id); }}
                  placeholder={hasVideo ? `Current: ${currentId} — paste new URL to change` : "Paste YouTube URL or video ID…"}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                />
                <button
                  onClick={() => handleSave(mod.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition shrink-0 ${
                    saved[mod.id]
                      ? "bg-green-500 text-white"
                      : "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                  }`}
                >
                  {saved[mod.id] ? "Saved!" : hasVideo ? "Update" : "Set Video"}
                </button>
              </div>
              {errors[mod.id] && (
                <p className="text-red-400 text-xs mt-2">{errors[mod.id]}</p>
              )}

              {/* Search helper */}
              {!hasVideo && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(mod.searchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Search YouTube for this lesson
                  </a>
                  <span>— copy the URL from the video page and paste it above</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-xs text-slate-500 space-y-1.5">
        <p className="font-bold text-slate-400">How to add a video:</p>
        <p>1. Find a relevant warehouse training video on YouTube</p>
        <p>2. Copy the full URL from your browser (e.g. <span className="text-slate-400 font-mono">https://www.youtube.com/watch?v=abc123</span>)</p>
        <p>3. Paste it into the field above and click Set Video — the 11-character ID is extracted automatically</p>
        <p>4. The video thumbnail and player will appear at the bottom of the lesson page immediately</p>
        <p className="text-slate-600 italic">Note: Videos must be set to public or unlisted on YouTube to embed correctly.</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ["Dashboard", "Revenue", "CRM", "Links", "Handbook", "Users & Access", "Subscriptions", "Talk Requests", "Lesson Videos"] as const;
type Tab = typeof TABS[number];

export default function OwnerPage() {
  const stats = ADMIN_STATS;
  const [activeTab, setActiveTab] = useState<Tab>("Users & Access");
  const pendingCount = useCompanyRequestStore((s) =>
    s.requests.filter((r) => r.status === "pending_approval" || r.status === "pending_onboarding").length
  );
  const talkUnreadCount = useTalkRequestStore((s) =>
    s.requests.filter((r) => r.status === "unread").length
  );

  function tabLabel(tab: Tab) {
    if (tab === "Dashboard")      return "📊 Dashboard";
    if (tab === "Revenue")        return "💰 Revenue";
    if (tab === "CRM")            return "🤝 CRM";
    if (tab === "Links")          return "🔗 Links";
    if (tab === "Handbook")       return "📖 Handbook";
    if (tab === "Users & Access") return "👥 Users & Access";
    if (tab === "Talk Requests")  return "💬 Talk Requests";
    if (tab === "Lesson Videos")  return "🎬 Lesson Videos";
    return "🏢 Subscriptions";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.22em]">Owner</p>
          <h1 className="mt-2 text-4xl font-black">Owner Control Center</h1>
          <p className="mt-2 text-slate-400">
            Manage subscribers, plans, user activity, invites, and platform controls.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2.5 text-sm font-bold rounded-t-xl transition -mb-px border-b-2 ${
                activeTab === tab
                  ? "border-yellow-400 text-yellow-400 bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-white"
              }`}
            >
              {tabLabel(tab)}
              {tab === "Subscriptions" && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-400 text-slate-950 text-xs font-black flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              {tab === "Talk Requests" && talkUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-400 text-slate-950 text-xs font-black flex items-center justify-center">
                  {talkUnreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard tab */}
        {activeTab === "Dashboard" && (
          <>
            <PublicPageLink />
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard label="Total Subscribers" value={stats.totalSubscribers} />
              <StatCard label="Personal" value={stats.personalSubscribers} />
              <StatCard label="Company" value={stats.companySubscribers} />
              <StatCard label="Active Today" value={stats.activeUsersToday} />
              <StatCard label="Total Sessions" value={stats.totalSessions} />
              <StatCard label="Banned Users" value={stats.bannedUsers} tone="danger" />
            </div>
            <UserManagement />
            <div className="grid xl:grid-cols-2 gap-6">
              <InviteManagement />
              <PlanControl />
            </div>
            <ActivityLog />
          </>
        )}

        {activeTab === "Revenue" && <RevenueTab />}
        {activeTab === "CRM" && <CRMSection />}
        {activeTab === "Links" && <LinkLibrary />}
        {activeTab === "Handbook" && <HandbookSection />}
        {activeTab === "Users & Access" && <UsersAccessSection />}
        {activeTab === "Subscriptions" && <SubscriptionsTab />}
        {activeTab === "Talk Requests" && <TalkRequestsSection />}
        {activeTab === "Lesson Videos" && <LessonVideosSection />}

      </div>
    </div>
  );
}
