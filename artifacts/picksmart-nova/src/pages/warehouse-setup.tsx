import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { CheckCircle2, ChevronRight, ChevronLeft, Warehouse, Mic, ScanBarcode, FileText, MapPin, ShieldCheck, Layers, Gauge, AlertTriangle, Zap } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useWarehouseProfileStore } from "@/lib/warehouseProfileStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface StepOption {
  value: string;
  label: string;
  labelEs: string;
  icon?: React.ReactNode;
  description?: string;
  descriptionEs?: string;
}

const STEPS = [
  {
    id: "systemType",
    title: "Picking System",
    titleEs: "Sistema de Picking",
    subtitle: "How does your warehouse direct pickers?",
    subtitleEs: "¿Cómo dirige tu almacén a los selectores?",
    icon: <Warehouse className="h-6 w-6" />,
    options: [
      { value: "voice", label: "Voice-Directed", labelEs: "Dirigido por Voz", icon: <Mic className="h-5 w-5" />, description: "NOVA, Vocollect, Honeywell", descriptionEs: "NOVA, Vocollect, Honeywell" },
      { value: "rf", label: "RF Scanner", labelEs: "Escáner RF", icon: <ScanBarcode className="h-5 w-5" />, description: "Zebra, Motorola scanner devices", descriptionEs: "Dispositivos Zebra, Motorola" },
      { value: "paper", label: "Paper / Pick Sheet", labelEs: "Papel / Hoja de Picking", icon: <FileText className="h-5 w-5" />, description: "Printed pick lists", descriptionEs: "Listas de picking impresas" },
    ] as StepOption[],
  },
  {
    id: "locationFormat",
    title: "Location Format",
    titleEs: "Formato de Ubicación",
    subtitle: "How are pick locations labeled in your facility?",
    subtitleEs: "¿Cómo están etiquetadas las ubicaciones en tu instalación?",
    icon: <MapPin className="h-6 w-6" />,
    options: [
      { value: "aisle-slot", label: "Aisle – Slot", labelEs: "Pasillo – Ranura", description: "Aisle 17 Slot 66", descriptionEs: "Pasillo 17 Ranura 66" },
      { value: "bin", label: "Bin System", labelEs: "Sistema de Bin", description: "Bin B-12-44", descriptionEs: "Bin B-12-44" },
      { value: "custom", label: "Custom / Other", labelEs: "Personalizado / Otro", description: "Zone, level, or warehouse-specific", descriptionEs: "Zona, nivel, o formato específico" },
    ] as StepOption[],
  },
  {
    id: "checkMethod",
    title: "Verification Method",
    titleEs: "Método de Verificación",
    subtitle: "How do pickers confirm the correct location?",
    subtitleEs: "¿Cómo confirman los selectores la ubicación correcta?",
    icon: <ShieldCheck className="h-6 w-6" />,
    options: [
      { value: "check-digits", label: "Check Digits", labelEs: "Dígitos de Verificación", description: "Speak or enter a 2–3 digit code", descriptionEs: "Decir o ingresar un código de 2–3 dígitos" },
      { value: "scan", label: "Barcode Scan", labelEs: "Escaneo de Código de Barras", description: "Scanner confirms the slot", descriptionEs: "El escáner confirma la ranura" },
      { value: "none", label: "No Verification", labelEs: "Sin Verificación", description: "Trust-based picking", descriptionEs: "Picking sin confirmación" },
    ] as StepOption[],
  },
  {
    id: "palletType",
    title: "Pallet System",
    titleEs: "Sistema de Pallets",
    subtitle: "What type of pallet setup does your warehouse use?",
    subtitleEs: "¿Qué tipo de sistema de pallets usa tu almacén?",
    icon: <Layers className="h-6 w-6" />,
    options: [
      { value: "alpha-bravo", label: "Alpha / Bravo", labelEs: "Alpha / Bravo", description: "Two pallets per slot (Alpha + Bravo)", descriptionEs: "Dos pallets por ranura (Alpha + Bravo)" },
      { value: "single", label: "Single Pallet", labelEs: "Pallet Único", description: "One pallet per stop", descriptionEs: "Un pallet por parada" },
    ] as StepOption[],
  },
  {
    id: "performanceMetric",
    title: "Performance Metric",
    titleEs: "Métrica de Rendimiento",
    subtitle: "How does your warehouse measure productivity?",
    subtitleEs: "¿Cómo mide tu almacén la productividad?",
    icon: <Gauge className="h-6 w-6" />,
    options: [
      { value: "cases-hour", label: "Cases per Hour (UPH)", labelEs: "Cajas por Hora (UPH)", description: "Most common in grocery warehouses", descriptionEs: "Lo más común en almacenes de comestibles" },
      { value: "lines-hour", label: "Lines per Hour (LPH)", labelEs: "Líneas por Hora (LPH)", description: "Common in general merchandise", descriptionEs: "Común en mercancía general" },
    ] as StepOption[],
  },
];

const PROBLEM_OPTIONS = [
  { value: "speed", label: "Speed / Pace", labelEs: "Velocidad / Ritmo", icon: <Zap className="h-4 w-4" /> },
  { value: "accuracy", label: "Accuracy / Errors", labelEs: "Exactitud / Errores", icon: <ShieldCheck className="h-4 w-4" /> },
  { value: "stacking", label: "Stacking / Pallet Building", labelEs: "Apilado / Construcción de Pallets", icon: <Layers className="h-4 w-4" /> },
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < step ? "bg-yellow-400" : i === step ? "bg-yellow-400/50" : "bg-slate-800"
          }`}
        />
      ))}
    </div>
  );
}

export default function WarehouseSetupPage() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith("es");
  const [, navigate] = useLocation();
  const { currentUser, jwtToken } = useAuthStore();
  const { saveProfile } = useWarehouseProfileStore();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [problems, setProblems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalSteps = STEPS.length + 1;
  const currentStep = STEPS[step];
  const isProblemsStep = step === STEPS.length;

  const handleSelect = (field: string, value: string) => {
    setAnswers((a) => ({ ...a, [field]: value }));
    setTimeout(() => setStep((s) => s + 1), 180);
  };

  const toggleProblem = (value: string) => {
    setProblems((p) => p.includes(value) ? p.filter((x) => x !== value) : [...p, value]);
  };

  const handleSave = async () => {
    setSaving(true);
    const profileData = {
      systemType: answers.systemType,
      locationFormat: answers.locationFormat,
      checkMethod: answers.checkMethod,
      palletType: answers.palletType,
      performanceMetric: answers.performanceMetric,
      mainProblems: problems,
    };

    const token = jwtToken ?? "";
    if (token) {
      await saveProfile(token, API_BASE, profileData);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate("/trainer-portal"), 1500);
  };

  if (saved) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-black mb-2">
          {isSpanish ? "¡Almacén Configurado!" : "Warehouse Configured!"}
        </h1>
        <p className="text-slate-400 text-sm">
          {isSpanish ? "NOVA ahora está calibrada para tu operación." : "NOVA is now calibrated for your operation."}
        </p>
        <p className="text-slate-600 text-xs mt-3">
          {isSpanish ? "Abriendo portal de entrenador…" : "Opening Trainer Portal…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col">
      {/* Header */}
      <div className="bg-[#141428] border-b border-white/5 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center">
          <Warehouse className="h-5 w-5 text-slate-950" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black leading-none">
            {isSpanish ? "Configuración del Almacén" : "Warehouse Setup"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSpanish ? "Calibra NOVA para tu operación" : "Calibrate NOVA for your operation"}
          </p>
        </div>
        {currentUser && (
          <p className="text-xs text-slate-600 font-mono">{currentUser.username}</p>
        )}
      </div>

      {/* Progress */}
      <div className="px-6 pt-5 pb-2 max-w-lg mx-auto w-full">
        <ProgressBar step={step} total={totalSteps} />
        <p className="text-[10px] text-slate-600 mt-2 font-mono">
          {isSpanish ? `PASO ${step + 1} DE ${totalSteps}` : `STEP ${step + 1} OF ${totalSteps}`}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-4 pb-8 max-w-lg mx-auto w-full">
        {!isProblemsStep && currentStep && (
          <div>
            {/* Step header */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-yellow-400">
                {currentStep.icon}
              </div>
              <div>
                <h2 className="text-xl font-black leading-tight">
                  {isSpanish ? currentStep.titleEs : currentStep.title}
                </h2>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6 ml-12">
              {isSpanish ? currentStep.subtitleEs : currentStep.subtitle}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {currentStep.options.map((opt) => {
                const selected = answers[currentStep.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(currentStep.id, opt.value)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-150 flex items-center gap-4 ${
                      selected
                        ? "border-yellow-400 bg-yellow-400/10"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/60"
                    }`}
                  >
                    {opt.icon && (
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        selected ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-400"
                      }`}>
                        {opt.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-base leading-tight ${selected ? "text-yellow-400" : "text-white"}`}>
                        {isSpanish ? opt.labelEs : opt.label}
                      </p>
                      {opt.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {isSpanish ? opt.descriptionEs : opt.description}
                        </p>
                      )}
                    </div>
                    {selected && <CheckCircle2 className="h-5 w-5 text-yellow-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Back */}
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="mt-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                {isSpanish ? "Atrás" : "Back"}
              </button>
            )}
          </div>
        )}

        {isProblemsStep && (
          <div>
            {/* Step header */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black leading-tight">
                {isSpanish ? "Principales Desafíos" : "Main Challenges"}
              </h2>
            </div>
            <p className="text-sm text-slate-400 mb-6 ml-12">
              {isSpanish
                ? "¿Cuáles son los mayores problemas en tu almacén? NOVA priorizará esas lecciones. (Elige todos los que apliquen)"
                : "What are the biggest problems in your warehouse? NOVA will prioritize those lessons. (Pick all that apply)"}
            </p>

            <div className="space-y-3 mb-6">
              {PROBLEM_OPTIONS.map((opt) => {
                const selected = problems.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleProblem(opt.value)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-150 flex items-center gap-4 ${
                      selected
                        ? "border-red-400/70 bg-red-400/10"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selected ? "bg-red-400/20 text-red-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      {opt.icon}
                    </div>
                    <p className={`font-black text-base flex-1 ${selected ? "text-red-300" : "text-white"}`}>
                      {isSpanish ? opt.labelEs : opt.label}
                    </p>
                    {selected && <CheckCircle2 className="h-5 w-5 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Summary preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-4 mb-6 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
                {isSpanish ? "Resumen de Configuración" : "Setup Summary"}
              </p>
              {STEPS.map((s) => answers[s.id] && (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-slate-500">{isSpanish ? s.titleEs : s.title}</span>
                  <span className="text-white font-bold capitalize">
                    {s.options.find((o) => o.value === answers[s.id])
                      ? (isSpanish
                          ? s.options.find((o) => o.value === answers[s.id])!.labelEs
                          : s.options.find((o) => o.value === answers[s.id])!.label)
                      : answers[s.id]}
                  </span>
                </div>
              ))}
              {problems.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{isSpanish ? "Problemas" : "Problems"}</span>
                  <span className="text-red-300 font-bold capitalize">{problems.join(", ")}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition text-sm font-bold"
              >
                <ChevronLeft className="h-4 w-4" />
                {isSpanish ? "Atrás" : "Back"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-slate-950 font-black text-base py-3.5 hover:bg-yellow-300 transition disabled:opacity-60"
              >
                {saving
                  ? (isSpanish ? "Guardando…" : "Saving…")
                  : (
                    <>
                      {isSpanish ? "Guardar y Continuar" : "Save & Continue"}
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
