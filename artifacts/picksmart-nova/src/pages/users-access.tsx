import { useState } from "react";
import { USERS } from "@/data/users";
import type { UserRole } from "@/data/users";
import { useAppStore } from "@/lib/store";
import { Users, Shield, Lock, UserCheck, Activity } from "lucide-react";

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  selector: ["View training modules", "Access My Assignments", "Run NOVA voice session", "View leaderboard", "Access NOVA Help"],
  trainer: ["All selector permissions", "Assignment Control", "Slot Master & Warehouse Reference", "Voice Commands reference", "Trainer Portal", "View selector progress"],
  supervisor: ["All trainer permissions", "Live Tracking", "Supervisor Dashboard", "Approve short picks", "Override assignments"],
  owner: ["All permissions", "Pricing management", "Users & Access control", "System settings", "Billing & reports"],
};

const ROLE_COLORS: Record<UserRole, string> = {
  selector: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  trainer: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  supervisor: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  owner: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function UsersAccessPage() {
  const { userId, role, setRole, setUserId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");

  const filteredUsers = USERS.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-yellow-400 rounded-xl">
            <Lock className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Users & Access</h1>
            <p className="text-slate-400 text-sm">Manage user roles and permissions for the PickSmart platform</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Active Session */}
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="h-5 w-5 text-yellow-400" />
            <h2 className="font-bold text-yellow-300">Current Demo Session</h2>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            You are currently viewing the app as <strong className="text-white capitalize">{role}</strong> ({USERS.find(u => u.id === userId)?.name ?? userId}).
            Switch your role below to simulate different permission levels.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["selector", "trainer", "supervisor", "owner"] as UserRole[]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-4 py-2 rounded-xl border font-bold text-sm capitalize transition ${
                  role === r
                    ? "border-yellow-400 bg-yellow-400 text-slate-950"
                    : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Role Permissions */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-400" /> Role Permissions
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {(Object.entries(ROLE_PERMISSIONS) as [UserRole, string[]][]).map(([r, perms]) => (
              <div key={r} className={`rounded-2xl border bg-slate-900 p-5 ${r === role ? "border-yellow-400" : "border-slate-800"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full border text-xs font-bold capitalize ${ROLE_COLORS[r]}`}>{r}</span>
                  {r === role && <span className="text-xs text-yellow-400 font-bold">Active</span>}
                </div>
                <ul className="space-y-2">
                  {perms.map(p => (
                    <li key={p} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Users className="h-4 w-4 text-yellow-400" /> All Users
            </h2>
            <div className="flex gap-2 ml-auto">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name or ID..."
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value as UserRole | "all")}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-yellow-400 transition"
              >
                <option value="all">All Roles</option>
                <option value="selector">Selector</option>
                <option value="trainer">Trainer</option>
                <option value="supervisor">Supervisor</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Employee ID</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-right px-5 py-3">Avg Rate</th>
                  <th className="text-right px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Demo</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className={`border-b border-slate-800 hover:bg-slate-800/30 transition ${u.id === userId ? "bg-yellow-400/5" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                          {u.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          {u.id === userId && <p className="text-xs text-yellow-400">Current session</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">{u.employeeId}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full border text-xs font-bold capitalize ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.avgRate > 0 ? (
                        <span className={`font-bold ${u.avgRate >= 100 ? "text-green-400" : u.avgRate >= 85 ? "text-yellow-400" : "text-slate-400"}`}>
                          {u.avgRate}%
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${u.isOnShift ? "bg-green-500/10 text-green-400" : "bg-slate-800 text-slate-500"}`}>
                        {u.isOnShift ? "On Shift" : "Off"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => { setUserId(u.id); setRole(u.role); }}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:border-yellow-400 hover:text-white transition flex items-center gap-1 ml-auto"
                      >
                        <Activity className="h-3 w-3" /> View as
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
