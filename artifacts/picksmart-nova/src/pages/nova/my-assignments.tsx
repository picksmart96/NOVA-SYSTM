import { useState } from "react";
import { Link } from "wouter";
import { ASSIGNMENTS } from "@/data/assignments";
import { Activity, MapPin, Play, Archive, Package, Clock, User } from "lucide-react";

const STATUS_STYLES = {
  pending: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  active: "bg-blue-400/10 text-blue-300 border-blue-400/30",
  completed: "bg-green-500/10 text-green-400 border-green-500/30",
};

const TYPE_STYLES = {
  TRAINING: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  PRODUCTION: "bg-orange-500/10 text-orange-300 border-orange-500/30",
};

export default function MyAssignmentsPage() {
  const [archived, setArchived] = useState<Set<string>>(new Set());

  const visible = ASSIGNMENTS.filter(a => !archived.has(a.id));

  const handleArchive = (id: string) => {
    setArchived(prev => new Set([...prev, id]));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center">
                <Activity className="h-6 w-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">My Assignments</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {visible.length} active · {archived.size} archived
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {visible.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-16 text-center">
            <Activity className="h-12 w-12 mx-auto text-slate-600 mb-4" />
            <p className="text-white font-black text-xl mb-2">No active assignments</p>
            <p className="text-slate-400">All assignments have been archived.</p>
          </div>
        )}

        {visible.map(assignment => (
          <div
            key={assignment.id}
            className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition-all"
          >
            {/* Card header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h2 className="text-2xl font-black text-white">
                    #{assignment.assignmentNumber}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${STATUS_STYLES[assignment.status]}`}>
                    {assignment.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${TYPE_STYLES[assignment.type]}`}>
                    {assignment.type}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{assignment.title}</p>
              </div>

              <button
                onClick={() => handleArchive(assignment.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold hover:border-red-500/40 hover:text-red-400 transition-all shrink-0"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            </div>

            {/* Stats grid */}
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" /> Aisles
                  </p>
                  <p className="text-white font-black text-lg">
                    {assignment.startAisle} → {assignment.endAisle}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <Package className="h-3 w-3" /> Cases
                  </p>
                  <p className="text-white font-black text-lg">{assignment.totalCases}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3" /> Goal Time
                  </p>
                  <p className="text-white font-black text-lg">{assignment.goalTimeMinutes}m</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <User className="h-3 w-3" /> Selector
                  </p>
                  <p className="text-white font-black text-sm truncate">{assignment.selectorUserId}</p>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {assignment.stops} stops · {assignment.totalPallets} pallets · Printer {assignment.printerNumber}
                </p>
                <div className="flex gap-2">
                  <Link href={`/nova/assignments/${assignment.id}`}>
                    <button className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-bold hover:border-slate-500 hover:text-white transition-all">
                      Details
                    </button>
                  </Link>
                  <Link href={`/nova/voice/${assignment.id}`}>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition-all">
                      <Play className="h-4 w-4" />
                      {assignment.status === "active" ? "Resume" : "Start Session"}
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Archived section */}
        {archived.size > 0 && (
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-2">
              <Archive className="h-3.5 w-3.5" /> Archived ({archived.size})
            </p>
            <div className="space-y-2">
              {ASSIGNMENTS.filter(a => archived.has(a.id)).map(a => (
                <div key={a.id} className="rounded-2xl border border-slate-800/50 bg-slate-900/50 px-5 py-3 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <p className="text-slate-400 font-bold text-sm">#{a.assignmentNumber}</p>
                    <span className="text-xs text-slate-600">{a.type}</span>
                    <span className="text-xs text-slate-600">{a.totalCases} cases</span>
                  </div>
                  <button
                    onClick={() => setArchived(prev => { const next = new Set(prev); next.delete(a.id); return next; })}
                    className="text-xs text-slate-600 hover:text-slate-400 transition"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
