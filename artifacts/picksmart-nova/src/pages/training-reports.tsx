import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import {
  BarChart2, ArrowLeft, CheckCircle2, AlertTriangle, Target,
  Clock, Zap, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Headphones, RefreshCw, Users
} from "lucide-react";

interface PickingReport {
  id: string;
  assignmentId: string;
  traineeId: string | null;
  traineeUsername: string | null;
  traineeName: string | null;
  trainerUserId: string | null;
  reportDate: string;
  totalCases: number | null;
  pickedCases: number | null;
  totalDurationSeconds: number | null;
  goalTimeMinutes: number | null;
  uphActual: number | null;
  uphStandard: number | null;
  efficiencyPercent: number | null;
  wrongCodeCount: number | null;
  overPickCount: number | null;
  shortPickCount: number | null;
  avgSlotTimeSeconds: number | null;
  performanceBand: string | null;
  novaFeedback: string | null;
  improvements: string | null;
  mistakeSummary: string | null;
  howToImprove: string | null;
  createdAt: string | null;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function bandColor(band: string | null) {
  if (band === "Outstanding")     return "text-green-300 border-green-500/30 bg-green-500/10";
  if (band === "On Target")       return "text-green-400 border-green-500/30 bg-green-500/10";
  if (band === "Acceptable")      return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
  if (band === "Below Standard")  return "text-red-400 border-red-500/30 bg-red-500/10";
  return "text-slate-400 border-slate-600 bg-slate-800";
}

function ReportCard({ report }: { report: PickingReport }) {
  const [expanded, setExpanded] = useState(false);
  const date = report.reportDate ?? report.createdAt?.slice(0, 10);
  const bc = bandColor(report.performanceBand);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between gap-4 hover:bg-slate-800/50 transition text-left"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${bc}`}>
            {(report.efficiencyPercent ?? 0) >= 100
              ? <CheckCircle2 className="h-5 w-5" />
              : <BarChart2 className="h-5 w-5" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {report.traineeName && (
                <span className="font-black text-white text-sm">{report.traineeName}</span>
              )}
              <span className="text-slate-500 text-xs">{date}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${bc}`}>
                {report.performanceBand ?? "—"}
              </span>
              {report.uphActual && (
                <span className="text-xs text-slate-400">{report.uphActual} UPH</span>
              )}
              {report.efficiencyPercent != null && (
                <span className="text-xs text-slate-400">{Math.round(report.efficiencyPercent)}% eff</span>
              )}
              {(report.wrongCodeCount ?? 0) > 0 && (
                <span className="text-xs text-red-400">{report.wrongCodeCount} wrong codes</span>
              )}
              {(report.overPickCount ?? 0) > 0 && (
                <span className="text-xs text-orange-400">{report.overPickCount} over</span>
              )}
              {(report.shortPickCount ?? 0) > 0 && (
                <span className="text-xs text-yellow-400">{report.shortPickCount} short</span>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-800 pt-4">
          {/* Stat grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatBox label="Cases" value={`${report.pickedCases ?? "—"}/${report.totalCases ?? "—"}`} />
            <StatBox label="Time" value={report.totalDurationSeconds ? formatTime(report.totalDurationSeconds) : "—"} />
            <StatBox label="Goal" value={report.goalTimeMinutes ? `${report.goalTimeMinutes}m` : "—"} />
            <StatBox label="UPH" value={report.uphActual ?? "—"} highlight={report.efficiencyPercent != null && report.efficiencyPercent >= 100} />
            <StatBox label="Efficiency" value={report.efficiencyPercent != null ? `${Math.round(report.efficiencyPercent)}%` : "—"} highlight={report.efficiencyPercent != null && report.efficiencyPercent >= 100} />
            <StatBox label="Avg Slot" value={report.avgSlotTimeSeconds ? `${report.avgSlotTimeSeconds.toFixed(1)}s` : "—"} />
          </div>

          {/* Mistake row */}
          <div className="grid grid-cols-3 gap-2">
            <MistakeBox label="Wrong Codes" count={report.wrongCodeCount ?? 0} color="red" />
            <MistakeBox label="Over Picks" count={report.overPickCount ?? 0} color="orange" />
            <MistakeBox label="Short Picks" count={report.shortPickCount ?? 0} color="yellow" />
          </div>

          {/* NOVA AI Feedback */}
          {report.novaFeedback && (
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Headphones className="h-4 w-4 text-yellow-400" />
                <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">NOVA Report</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Overall</p>
                <p className="text-slate-300 text-sm leading-relaxed">{report.novaFeedback}</p>
              </div>
              {report.improvements && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">What to Improve</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{report.improvements}</p>
                </div>
              )}
              {report.mistakeSummary && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mistake Patterns</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{report.mistakeSummary}</p>
                </div>
              )}
              {report.howToImprove && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tips for Next Session</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{report.howToImprove}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 text-center ${highlight ? "border-green-500/30 bg-green-500/10" : "border-slate-700 bg-slate-950"}`}>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm font-black ${highlight ? "text-green-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function MistakeBox({ label, count, color }: { label: string; count: number; color: "red" | "orange" | "yellow" }) {
  const cls = count > 0
    ? color === "red"    ? "border-red-500/30 bg-red-500/10 text-red-400"
    : color === "orange" ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                         : "border-yellow-400/30 bg-yellow-400/10 text-yellow-400"
    : "border-slate-700 bg-slate-950 text-slate-500";
  return (
    <div className={`rounded-2xl border p-3 text-center ${cls}`}>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black">{count}</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TrainingReportsPage() {
  const { jwtToken, currentUser } = useAuthStore();
  const [reports, setReports]     = useState<PickingReport[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [view, setView]           = useState<"mine" | "all">("mine");

  const isStaff = ["trainer", "supervisor", "admin", "owner"].includes(currentUser?.role ?? "");

  const fetchReports = async () => {
    if (!jwtToken) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = view === "all" && isStaff
        ? (currentUser?.role === "trainer" ? "/api/picking-reports/trainer" : "/api/picking-reports/all")
        : "/api/picking-reports/mine";
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!res.ok) throw new Error("Failed");
      setReports(await res.json());
    } catch {
      setError("Could not load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [view, jwtToken]); // eslint-disable-line

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/nova">
              <button className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center hover:border-slate-500 transition">
                <ArrowLeft className="h-4 w-4 text-slate-400" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-black">Training Reports</h1>
              <p className="text-slate-500 text-xs">NOVA AI post-session analysis</p>
            </div>
          </div>
          <button
            onClick={fetchReports}
            className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center hover:border-slate-500 transition"
          >
            <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* View toggle (trainers+) */}
        {isStaff && (
          <div className="flex gap-2 p-1 rounded-2xl border border-slate-800 bg-slate-900">
            <button
              onClick={() => setView("mine")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition ${view === "mine" ? "bg-yellow-400 text-slate-950" : "text-slate-400 hover:text-white"}`}
            >
              My Sessions
            </button>
            <button
              onClick={() => setView("all")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${view === "all" ? "bg-yellow-400 text-slate-950" : "text-slate-400 hover:text-white"}`}
            >
              <Users className="h-4 w-4" />
              {currentUser?.role === "trainer" ? "My Trainees" : "All Reports"}
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-300 mb-4">{error}</p>
            <button onClick={fetchReports} className="px-5 py-2 rounded-2xl border border-red-500/40 text-red-300 text-sm">Retry</button>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 flex flex-col items-center gap-4 text-center">
            <BarChart2 className="h-12 w-12 text-slate-600" />
            <div>
              <p className="text-white font-bold mb-1">No reports yet</p>
              <p className="text-slate-400 text-sm">
                {view === "mine"
                  ? "Complete a picking session to see your NOVA performance report here."
                  : "No trainee reports to show yet."}
              </p>
            </div>
            <Link href="/nova">
              <button className="rounded-2xl border border-slate-700 px-5 py-2 text-sm text-slate-300 hover:border-slate-500 transition">
                Go to Assignments
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
