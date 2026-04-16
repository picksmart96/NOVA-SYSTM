import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { useTranslation } from "react-i18next";
import {
  Upload, Shuffle, Plus, Trash2, ArrowLeft, Save,
  CheckCircle2, AlertCircle, FileText, Zap, ChevronDown, ChevronUp
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface Stop {
  aisle: string;
  slot: string;
  qty: string;
  checkCode: string;
}

type Mode = "csv" | "manual" | "random";

function generateRandom(count: number, startAisle = 10, endAisle = 30): Stop[] {
  const stops: Stop[] = [];
  for (let i = 0; i < count; i++) {
    stops.push({
      aisle: String(Math.floor(startAisle + Math.random() * (endAisle - startAisle + 1))),
      slot:  String(Math.floor(Math.random() * 200) + 1),
      qty:   String(Math.floor(Math.random() * 10) + 1),
      checkCode: String(Math.floor(100 + Math.random() * 900)),
    });
  }
  stops.sort((a, b) => Number(a.aisle) - Number(b.aisle) || Number(a.slot) - Number(b.slot));
  return stops;
}

function parseCSV(text: string): Stop[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const header = lines[0]?.toLowerCase();
  const dataStart = header?.includes("aisle") ? 1 : 0;
  return lines.slice(dataStart).map((line) => {
    const parts = line.split(",");
    return {
      aisle:     (parts[0] ?? "").trim(),
      slot:      (parts[1] ?? "").trim(),
      qty:       (parts[2] ?? "").trim(),
      checkCode: (parts[3] ?? "").trim(),
    };
  }).filter((s) => s.aisle && s.slot);
}

export default function AssignmentBuilderPage() {
  const [, navigate]     = useLocation();
  const { jwtToken }     = useAuthStore();
  const { i18n }         = useTranslation();
  const isSpanish        = i18n.language?.startsWith("es");

  const [mode, setMode]           = useState<Mode>("csv");
  const [stops, setStops]         = useState<Stop[]>([]);
  const [title, setTitle]         = useState("");
  const [goalMinutes, setGoalMinutes] = useState("");
  const [randomCount, setRandomCount] = useState("20");
  const [startAisle, setStartAisle] = useState("10");
  const [endAisle, setEndAisle]   = useState("30");
  const [csvError, setCsvError]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState<{ id: string; title: string } | null>(null);
  const [error, setError]         = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError("");
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) { setCsvError("No valid rows found. Expected: aisle,slot,qty,check"); return; }
        setStops(parsed);
      } catch {
        setCsvError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleGenerateRandom() {
    setStops(generateRandom(Number(randomCount) || 20, Number(startAisle) || 10, Number(endAisle) || 30));
    setError("");
  }

  function addStop() {
    setStops((p) => [...p, { aisle: "", slot: "", qty: "", checkCode: "" }]);
  }

  function removeStop(i: number) {
    setStops((p) => p.filter((_, idx) => idx !== i));
  }

  function updateStop(i: number, key: keyof Stop, val: string) {
    setStops((p) => p.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  }

  const totalCases = stops.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
  const isValid    = stops.length > 0 && stops.every((s) => s.aisle && s.slot && s.qty && s.checkCode);

  async function handleSave() {
    if (!isValid) { setError("All stops must have aisle, slot, qty, and check code."); return; }

    setSaving(true);
    setError("");

    try {
      const sortedStops = [...stops].sort((a, b) => Number(a.aisle) - Number(b.aisle) || Number(a.slot) - Number(b.slot));
      const aisles = sortedStops.map((s) => Number(s.aisle));

      const assignRes = await fetch(`${API_BASE}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}) },
        body: JSON.stringify({
          assignmentNumber: Math.floor(1000 + Math.random() * 9000),
          title: title.trim() || `Training Run ${new Date().toLocaleDateString()}`,
          startAisle: Math.min(...aisles),
          endAisle:   Math.max(...aisles),
          totalCases,
          totalCube: 0,
          totalPallets: 1,
          doorNumber: 1,
          status: "pending",
          voiceMode: "training",
          goalTimeMinutes: goalMinutes ? Number(goalMinutes) : null,
          percentComplete: 0,
        }),
      });

      if (!assignRes.ok) throw new Error("Failed to create assignment");
      const assignment = await assignRes.json();

      const stopsPayload = sortedStops.map((s, i) => ({
        aisle: Number(s.aisle),
        slot:  Number(s.slot),
        qty:   Number(s.qty),
        checkCode: s.checkCode.trim(),
        stopOrder: i,
      }));

      const stopsRes = await fetch(`${API_BASE}/assignments/${assignment.id}/stops/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}) },
        body: JSON.stringify({ stops: stopsPayload }),
      });

      if (!stopsRes.ok) throw new Error("Failed to save stops");

      setSaved({ id: assignment.id, title: assignment.title });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assignment.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">{isSpanish ? "¡Asignación guardada!" : "Assignment Saved!"}</h2>
          <p className="text-slate-400 text-sm mb-2">{saved.title}</p>
          <p className="text-slate-600 text-xs mb-8">{stops.length} stops · {totalCases} total cases</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/trainer-portal")}
              className="w-full rounded-xl bg-yellow-400 text-slate-950 font-black py-3 text-sm hover:bg-yellow-300 transition"
            >
              {isSpanish ? "Ir al Portal de Entrenamiento" : "Go to Trainer Portal"}
            </button>
            <button
              onClick={() => { setSaved(null); setStops([]); setTitle(""); }}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 text-white font-bold py-3 text-sm hover:border-slate-500 transition"
            >
              {isSpanish ? "Crear otra asignación" : "Build another assignment"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/trainer-portal")} className="text-slate-500 hover:text-white transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black">{isSpanish ? "Constructor de Asignaciones" : "Assignment Builder"}</h1>
            <p className="text-slate-500 text-sm">{isSpanish ? "Crea asignaciones de entrenamiento con paradas de picking" : "Build training assignments with pick stops"}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: config panel ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Assignment details */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                {isSpanish ? "Detalles" : "Details"}
              </h3>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">{isSpanish ? "Nombre de la asignación" : "Assignment Title"}</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isSpanish ? "Turno Matutino — Ala A" : "Morning Shift — Wing A"}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">{isSpanish ? "Meta de tiempo (min)" : "Goal Time (min)"}</label>
                <input
                  type="number"
                  value={goalMinutes}
                  onChange={(e) => setGoalMinutes(e.target.value)}
                  placeholder="60"
                  min="1"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40 transition"
                />
              </div>
            </div>

            {/* Mode selector */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-3">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                {isSpanish ? "Método de entrada" : "Input Method"}
              </h3>

              {(["csv", "manual", "random"] as Mode[]).map((m) => {
                const labels: Record<Mode, { icon: React.ReactNode; label: string; sub: string }> = {
                  csv:    { icon: <Upload className="h-4 w-4" />,  label: "CSV Upload",    sub: "Import from spreadsheet" },
                  manual: { icon: <Plus className="h-4 w-4" />,    label: "Manual Entry",  sub: "Type stops one by one" },
                  random: { icon: <Shuffle className="h-4 w-4" />, label: "Random Gen",    sub: "Auto-generate stops" },
                };
                const { icon, label, sub } = labels[m];
                return (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setStops([]); setCsvError(""); }}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition flex items-center gap-3 ${
                      mode === m
                        ? "border-yellow-400/50 bg-yellow-400/10 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span className={mode === m ? "text-yellow-400" : ""}>{icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${mode === m ? "text-white" : ""}`}>{label}</p>
                      <p className="text-[11px] text-slate-600">{sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mode-specific controls */}
            {mode === "csv" && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">CSV Import</h3>
                <p className="text-xs text-slate-500">Format: <code className="text-yellow-400">aisle,slot,qty,check</code></p>
                <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center">
                  <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-sm text-yellow-400 font-bold hover:underline"
                  >
                    {isSpanish ? "Seleccionar archivo CSV" : "Choose CSV file"}
                  </button>
                  <p className="text-xs text-slate-600 mt-1">or drag and drop</p>
                  <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
                </div>
                {csvError && <p className="text-xs text-red-400">{csvError}</p>}
              </div>
            )}

            {mode === "random" && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                  {isSpanish ? "Configuración aleatoria" : "Random Config"}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "# Stops", key: "randomCount", val: randomCount, set: setRandomCount },
                    { label: "Start Aisle", key: "startAisle", val: startAisle, set: setStartAisle },
                    { label: "End Aisle",   key: "endAisle",   val: endAisle,   set: setEndAisle },
                  ].map(({ label, val, set: s }) => (
                    <div key={label}>
                      <label className="block text-xs text-slate-500 mb-1">{label}</label>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => s(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-400/40 transition"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleGenerateRandom}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2.5 text-sm transition"
                >
                  <Shuffle className="h-4 w-4 text-yellow-400" />
                  {isSpanish ? "Generar" : "Generate Stops"}
                </button>
              </div>
            )}

            {mode === "manual" && (
              <button
                onClick={addStop}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 hover:border-yellow-400/50 text-slate-400 hover:text-yellow-400 font-bold py-4 text-sm transition"
              >
                <Plus className="h-4 w-4" /> {isSpanish ? "Agregar parada" : "Add Stop"}
              </button>
            )}
          </div>

          {/* ── Right: stop table + save ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Stats row */}
            {stops.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Stops",   val: stops.length },
                  { label: "Cases",   val: totalCases },
                  { label: "Aisles",  val: new Set(stops.map((s) => s.aisle)).size },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-center">
                    <p className="text-2xl font-black text-yellow-400">{val}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Preview toggle */}
            {stops.length > 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition"
                >
                  <span className="text-sm font-black text-slate-300">
                    {isSpanish ? `Vista previa (${stops.length} paradas)` : `Stop Preview (${stops.length} stops)`}
                  </span>
                  {showPreview ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>

                {showPreview && (
                  <div className="border-t border-slate-800 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left px-4 py-2.5 text-slate-600 font-bold uppercase tracking-wider">#</th>
                          <th className="text-left px-4 py-2.5 text-slate-600 font-bold uppercase tracking-wider">Aisle</th>
                          <th className="text-left px-4 py-2.5 text-slate-600 font-bold uppercase tracking-wider">Slot</th>
                          <th className="text-left px-4 py-2.5 text-slate-600 font-bold uppercase tracking-wider">Qty</th>
                          <th className="text-left px-4 py-2.5 text-slate-600 font-bold uppercase tracking-wider">Check</th>
                          {mode === "manual" && <th className="px-4 py-2.5" />}
                        </tr>
                      </thead>
                      <tbody>
                        {stops.map((s, i) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="px-4 py-2 text-slate-600">{i + 1}</td>
                            {mode === "manual" ? (
                              <>
                                {(["aisle", "slot", "qty", "checkCode"] as (keyof Stop)[]).map((key) => (
                                  <td key={key} className="px-2 py-1.5">
                                    <input
                                      value={s[key]}
                                      onChange={(e) => updateStop(i, key, e.target.value)}
                                      placeholder={key === "checkCode" ? "Code" : ""}
                                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white text-xs outline-none focus:ring-1 focus:ring-yellow-400/40"
                                    />
                                  </td>
                                ))}
                                <td className="px-2 py-1.5">
                                  <button onClick={() => removeStop(i)} className="text-slate-600 hover:text-red-400 transition">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-2 text-white font-bold">{s.aisle}</td>
                                <td className="px-4 py-2 text-white">{s.slot}</td>
                                <td className="px-4 py-2 text-yellow-400 font-bold">{s.qty}</td>
                                <td className="px-4 py-2 font-mono text-slate-300">{s.checkCode}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {mode === "manual" && (
                      <div className="px-4 py-3 border-t border-slate-800">
                        <button
                          onClick={addStop}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-yellow-400 transition font-bold"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {isSpanish ? "Agregar parada" : "Add stop"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {stops.length === 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
                <Zap className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-bold mb-1">
                  {isSpanish ? "Sin paradas todavía" : "No stops yet"}
                </p>
                <p className="text-slate-700 text-xs">
                  {mode === "csv"    && (isSpanish ? "Sube un archivo CSV para comenzar." : "Upload a CSV file to get started.")}
                  {mode === "manual" && (isSpanish ? "Agrega paradas usando el botón de arriba." : 'Click "Add Stop" to add your first pick location.')}
                  {mode === "random" && (isSpanish ? "Configura y genera paradas aleatorias." : "Configure and click Generate to create random stops.")}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/20 px-4 py-3 flex items-center gap-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || stops.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-slate-950 font-black py-4 text-sm hover:bg-yellow-300 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving
                ? (isSpanish ? "Guardando…" : "Saving…")
                : (isSpanish ? `Guardar asignación (${stops.length} paradas)` : `Save Assignment (${stops.length} stops)`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
