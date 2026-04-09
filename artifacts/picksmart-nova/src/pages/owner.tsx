import { useMemo, useState } from "react";
import { Copy, ExternalLink, Globe, Key, Link as LucideLink, ShieldCheck, Users, BookOpen, Mic, LayoutDashboard, Activity, Shield, UserPlus, Check, Mail, Share2, Warehouse as WarehouseIcon } from "lucide-react";
import { Link } from "wouter";
import { OWNER_TOKEN } from "./owner-access";
import { useAuthStore, AuthAccount, AuthRole } from "@/lib/authStore";
import { useAccessStore } from "@/lib/accessStore";
import { useWarehouseStore } from "@/lib/warehouseStore";
import { DEFAULT_WAREHOUSES, SYSTEM_TYPE_LABEL } from "@/data/warehouses";

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
  const [copiedMagic,  setCopiedMagic]  = useState(false);

  const base      = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  const publicUrl = `${window.location.origin}${base}/`;
  const magicUrl  = `${window.location.origin}${base}/owner-access?token=${OWNER_TOKEN}`;

  function copyPublic() {
    navigator.clipboard.writeText(publicUrl);
    setCopiedPublic(true);
    setTimeout(() => setCopiedPublic(false), 2000);
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
    const link = `${window.location.origin}/invite/${token}`;
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
      const url = `${window.location.origin}/invite/${token}`;
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

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ["Dashboard", "Links", "Handbook", "Users & Access"] as const;
type Tab = typeof TABS[number];

export default function OwnerPage() {
  const stats = ADMIN_STATS;
  const [activeTab, setActiveTab] = useState<Tab>("Users & Access");

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
        <div className="flex gap-2 border-b border-slate-800 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition -mb-px border-b-2 ${
                activeTab === tab
                  ? "border-yellow-400 text-yellow-400 bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-white"
              }`}
            >
              {tab === "Dashboard" ? "📊 Dashboard"
                : tab === "Links" ? "🔗 Links"
                : tab === "Handbook" ? "📖 Handbook"
                : "👥 Users & Access"}
            </button>
          ))}
        </div>

        {/* Dashboard tab */}
        {activeTab === "Dashboard" && (
          <>
            {/* Public page link */}
            <PublicPageLink />

            {/* Top stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard label="Total Subscribers" value={stats.totalSubscribers} />
              <StatCard label="Personal" value={stats.personalSubscribers} />
              <StatCard label="Company" value={stats.companySubscribers} />
              <StatCard label="Active Today" value={stats.activeUsersToday} />
              <StatCard label="Total Sessions" value={stats.totalSessions} />
              <StatCard label="Banned Users" value={stats.bannedUsers} tone="danger" />
            </div>

            {/* User Management (full width) */}
            <UserManagement />

            {/* Side-by-side: Invite + Plan Control */}
            <div className="grid xl:grid-cols-2 gap-6">
              <InviteManagement />
              <PlanControl />
            </div>

            {/* Activity Log */}
            <ActivityLog />
          </>
        )}

        {/* Links tab */}
        {activeTab === "Links" && <LinkLibrary />}

        {/* Handbook tab */}
        {activeTab === "Handbook" && <HandbookSection />}

        {/* Users & Access tab */}
        {activeTab === "Users & Access" && <UsersAccessSection />}

      </div>
    </div>
  );
}
