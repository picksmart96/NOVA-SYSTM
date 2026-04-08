import { useState } from "react";
import { useAuthStore, AuthAccount, AuthRole } from "@/lib/authStore";

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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AuthRole>("selector");
  const [lastLink, setLastLink] = useState<string | null>(null);

  function sendInvite() {
    if (!fullName.trim() || !email.trim()) return;
    const token = addInvite({ fullName: fullName.trim(), email: email.trim(), role });
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
                  <p className="text-xs text-slate-500">{inv.email} · {inv.role}</p>
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OwnerPage() {
  const stats = ADMIN_STATS;

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

      </div>
    </div>
  );
}
