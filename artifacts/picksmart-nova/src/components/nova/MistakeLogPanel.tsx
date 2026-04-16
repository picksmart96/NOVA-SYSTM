import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { isStruggling, STRUGGLING_THRESHOLD } from "@/lib/mistakeLog";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface NovaMistake {
  id: string;
  selectorId?: string | null;
  sessionId?: string | null;
  mistakeType?: string | null;
  description?: string | null;
  expectedAction?: string | null;
  actualAction?: string | null;
  severity?: string | null;
  createdAt: string;
}

interface MistakeSummary {
  selectorId: string | null;
  total: number;
  highSeverity: number;
  lastMistake: string;
}

function severityBadge(s?: string | null) {
  if (s === "high")   return "bg-red-500/20 text-red-400 border-red-500/30";
  if (s === "medium") return "bg-yellow-400/10 text-yellow-400 border-yellow-400/30";
  return "bg-slate-700 text-slate-400 border-slate-600";
}

function typeLabel(t?: string | null) {
  if (t === "check_error")    return { label: "Check Error",    color: "text-red-400" };
  if (t === "stacking_error") return { label: "Stack Error",    color: "text-orange-400" };
  if (t === "movement_delay") return { label: "Movement Delay", color: "text-yellow-400" };
  return { label: t ?? "Unknown", color: "text-slate-400" };
}

function formatRelative(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface Props {
  selectorId?: string;
  selectorName?: string;
}

export default function MistakeLogPanel({ selectorId, selectorName }: Props) {
  const { jwtToken } = useAuthStore();
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith("es");

  const [mistakes, setMistakes]     = useState<NovaMistake[]>([]);
  const [summary, setSummary]       = useState<MistakeSummary[]>([]);
  const [loading, setLoading]       = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [viewSelector, setViewSelector] = useState<string | null>(selectorId ?? null);

  const fetchData = async () => {
    if (!jwtToken) return;
    setLoading(true);
    try {
      const [mistakeRes, summaryRes] = await Promise.all([
        fetch(
          `${API_BASE}/mistakes${viewSelector ? `?selectorId=${encodeURIComponent(viewSelector)}&limit=50` : "?limit=50"}`,
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        ),
        fetch(`${API_BASE}/mistakes/summary`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }),
      ]);
      if (mistakeRes.ok)  setMistakes(await mistakeRes.json());
      if (summaryRes.ok)  setSummary(await summaryRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [viewSelector, jwtToken]);

  const totalMistakes  = mistakes.length;
  const highCount      = mistakes.filter((m) => m.severity === "high").length;
  const struggling     = isStruggling(totalMistakes);

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h3 className="text-base font-black text-white">
            {isSpanish ? "Registro de Errores" : "Mistake Log"}
            {selectorName && <span className="text-slate-400 font-normal ml-1">— {selectorName}</span>}
          </h3>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {isSpanish ? "Actualizar" : "Refresh"}
        </button>
      </div>

      {/* Summary cards */}
      {summary.length > 0 && !selectorId && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {summary.slice(0, 6).map((s) => (
            <button
              key={s.selectorId ?? "null"}
              onClick={() => setViewSelector(viewSelector === s.selectorId ? null : s.selectorId)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                viewSelector === s.selectorId
                  ? "border-yellow-400/50 bg-yellow-400/10"
                  : isStruggling(s.total)
                  ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                  : "border-slate-800 bg-slate-900/40 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-white truncate max-w-[100px]">
                  {s.selectorId ? s.selectorId.slice(0, 8) + "…" : "Unknown"}
                </p>
                {isStruggling(s.total) && (
                  <span className="text-[9px] font-black text-red-400 border border-red-500/30 rounded px-1">RETRAIN</span>
                )}
              </div>
              <p className={`text-2xl font-black ${isStruggling(s.total) ? "text-red-400" : "text-yellow-400"}`}>
                {s.total}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {s.highSeverity} {isSpanish ? "críticos" : "critical"} · {formatRelative(s.lastMistake)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Struggling alert */}
      {struggling && (
        <div className="rounded-2xl border border-red-500/40 bg-red-950/30 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-red-300 mb-0.5">
              {isSpanish ? "Selector con dificultades — reentrenamiento recomendado" : "Selector struggling — retraining recommended"}
            </p>
            <p className="text-xs text-slate-400">
              {isSpanish
                ? `${totalMistakes} errores detectados en esta sesión (umbral: ${STRUGGLING_THRESHOLD}).`
                : `${totalMistakes} mistakes detected (threshold: ${STRUGGLING_THRESHOLD}). Consider scheduling a coaching session.`}
            </p>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {mistakes.length > 0 && (
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-slate-500">{isSpanish ? "Total" : "Total"}: </span>
            <span className="font-black text-white">{totalMistakes}</span>
          </div>
          <div>
            <span className="text-slate-500">{isSpanish ? "Críticos" : "High"}: </span>
            <span className="font-black text-red-400">{highCount}</span>
          </div>
          {viewSelector && (
            <button
              onClick={() => setViewSelector(null)}
              className="text-slate-500 hover:text-slate-300 transition text-xs"
            >
              {isSpanish ? "← Ver todos" : "← All selectors"}
            </button>
          )}
        </div>
      )}

      {/* Mistake list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-6 w-6 text-slate-600 animate-spin" />
        </div>
      ) : mistakes.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 px-5 py-8 text-center">
          <Zap className="h-8 w-8 text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            {isSpanish ? "Sin errores registrados." : "No mistakes logged yet — great accuracy!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {mistakes.map((m) => {
            const { label, color } = typeLabel(m.mistakeType);
            const isOpen = expanded === m.id;
            return (
              <div
                key={m.id}
                className={`rounded-2xl border transition ${
                  m.severity === "high"
                    ? "border-red-500/25 bg-red-950/20"
                    : m.severity === "medium"
                    ? "border-yellow-400/20 bg-yellow-950/10"
                    : "border-slate-800 bg-slate-900/30"
                }`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : m.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <AlertTriangle className={`h-4 w-4 shrink-0 ${
                    m.severity === "high" ? "text-red-400" :
                    m.severity === "medium" ? "text-yellow-400" : "text-slate-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-black ${color}`}>{label}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${severityBadge(m.severity)}`}>
                        {m.severity ?? "?"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{m.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">{formatRelative(m.createdAt)}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-slate-600 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-600 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-600 uppercase tracking-widest text-[9px] mb-0.5">{isSpanish ? "Acción esperada" : "Expected"}</p>
                      <p className="text-white font-bold font-mono">{m.expectedAction ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 uppercase tracking-widest text-[9px] mb-0.5">{isSpanish ? "Acción real" : "Actual"}</p>
                      <p className="text-red-300 font-bold font-mono">{m.actualAction ?? "—"}</p>
                    </div>
                    {m.sessionId && (
                      <div className="col-span-2">
                        <p className="text-slate-600 uppercase tracking-widest text-[9px] mb-0.5">Session</p>
                        <p className="text-slate-400 font-mono truncate">{m.sessionId}</p>
                      </div>
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
