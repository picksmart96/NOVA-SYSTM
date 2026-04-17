/**
 * NOVA Load Pick Safety Gate
 * Full ES3-style sign-on: Equipment ID → Safety Check → Load Picks
 * Run before every picking assignment.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { novaSpeak, novaRecogLang } from "@/lib/novaSpeech";
import { useTranslation } from "react-i18next";
import {
  Zap, ShieldCheck, Mic, MicOff, ChevronRight, Activity,
  CheckCircle2, XCircle, Loader2, Volume2, RefreshCw,
} from "lucide-react";

// ── Safety items ───────────────────────────────────────────────────────────────
const SAFETY_EN = [
  "Brakes okay?",
  "Battery guard okay?",
  "Horn okay?",
  "Wheels okay?",
  "Hydraulics okay?",
  "Controls okay?",
  "Steering okay?",
  "Welds okay?",
  "Electric wiring okay?",
];
const SAFETY_ES = [
  "¿Frenos bien?",
  "¿Protector de batería bien?",
  "¿Bocina bien?",
  "¿Llantas bien?",
  "¿Hidráulicos bien?",
  "¿Controles bien?",
  "¿Dirección bien?",
  "¿Soldaduras bien?",
  "¿Cableado eléctrico bien?",
];

// ── Phase type ─────────────────────────────────────────────────────────────────
type Phase =
  | "gate"          // tap-to-unlock TTS
  | "loading"       // fetching assignment from API
  | "no_assignment" // no active assignment
  | "equip_enter"   // type/speak equipment ID
  | "equip_confirm" // NOVA reads back ID, user confirms
  | "safety"        // safety check items
  | "safety_fail"   // safety check failed
  | "all_clear"     // safety passed, starting session
  | "going";        // navigating

interface DbAssignment {
  id: string;
  title: string;
  totalCases: number;
  startAisle: number;
  endAisle: number;
  goalTimeMinutes: number | null;
  doorNumber: number;
  totalPallets: number | null;
  status: string;
  selectorUserId: string | null;
}

export default function NovaLoadPickPage() {
  const [, navigate] = useLocation();
  const { currentUser, jwtToken } = useAuthStore();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("es") ? "es" : "en";

  const safetyItems = lang === "es" ? SAFETY_ES : SAFETY_EN;

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase,       setPhase]       = useState<Phase>("gate");
  const [prompt,      setPrompt]      = useState("");
  const [assignment,  setAssignment]  = useState<DbAssignment | null>(null);
  const [equipInput,  setEquipInput]  = useState("");
  const [equipId,     setEquipId]     = useState("");
  const [safetyIdx,   setSafetyIdx]   = useState(0);
  const [failedItem,  setFailedItem]  = useState("");
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Refs for closure safety
  const phaseRef      = useRef<Phase>("gate");
  const safetyIdxRef  = useRef(0);
  const equipIdRef    = useRef("");
  const assignmentRef = useRef<DbAssignment | null>(null);
  const recRef        = useRef<any>(null);

  useEffect(() => { phaseRef.current      = phase;      }, [phase]);
  useEffect(() => { safetyIdxRef.current  = safetyIdx;  }, [safetyIdx]);
  useEffect(() => { equipIdRef.current    = equipId;    }, [equipId]);
  useEffect(() => { assignmentRef.current = assignment; }, [assignment]);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    setIsSpeaking(true);
    setPrompt(text);
    stopListening();
    novaSpeak(text, lang, () => {
      setIsSpeaking(false);
      onEnd?.();
    }, { rate: 0.92, pitch: 1 });
  }, [lang]); // eslint-disable-line

  // ── Speech recognition ─────────────────────────────────────────────────────
  const stopListening = () => {
    try { recRef.current?.abort(); } catch {}
    recRef.current = null;
    setIsListening(false);
  };

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    stopListening();

    const rec = new SR();
    rec.continuous     = false;
    rec.interimResults = false;
    rec.lang           = novaRecogLang(lang);
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => { setIsListening(false); recRef.current = null; };
    rec.onerror  = () => { setIsListening(false); recRef.current = null; };
    rec.onresult = (e: any) => {
      const heard = (e.results?.[0]?.[0]?.transcript || "").toLowerCase().trim();
      handleVoiceInput(heard);
    };

    recRef.current = rec;
    setIsListening(true);
    try { rec.start(); } catch {}
  }, [lang]); // eslint-disable-line

  // ── Voice input handler ────────────────────────────────────────────────────
  const handleVoiceInput = useCallback((heard: string) => {
    const ph   = phaseRef.current;
    const idx  = safetyIdxRef.current;
    const eId  = equipIdRef.current;
    const items = lang === "es" ? SAFETY_ES : SAFETY_EN;

    const isYes = /yes|yeah|yep|okay|ok|confirm|correct|right|sure|si|sí|afirm/i.test(heard);
    const isNo  = /\bno\b|nope|cancel|negative|wrong|fail/i.test(heard);

    if (ph === "equip_confirm") {
      if (isYes) {
        // Confirmed — start safety
        setSafetyIdx(0);
        setPhase("safety");
        speak(items[0], () => startListening());
      } else {
        // Re-enter
        setEquipId("");
        setEquipInput("");
        setPhase("equip_enter");
        speak(lang === "es" ? "Ingresa el número de equipo." : "Enter equipment ID.");
      }
      return;
    }

    if (ph === "safety") {
      if (isYes) {
        const next = idx + 1;
        if (next >= items.length) {
          // All passed → Load Picks
          const a = assignmentRef.current;
          setPhase("all_clear");
          const msg = lang === "es"
            ? `Controles de seguridad completados. Cargando turnos. Pasillos ${a?.startAisle} al ${a?.endAisle}. ${a?.totalCases} cajas. Tiempo estimado ${a?.goalTimeMinutes ?? "?"} minutos. Espera tu asignación.`
            : `All safety checks complete. Load Picks. Aisles ${a?.startAisle} through ${a?.endAisle}. ${a?.totalCases} cases. Goal time ${a?.goalTimeMinutes ?? "?"} minutes. Standby for your assignment.`;
          speak(msg, () => {
            setTimeout(() => {
              if (a) { setPhase("going"); navigate(`/nova/voice/${a.id}`); }
            }, 1200);
          });
        } else {
          setSafetyIdx(next);
          speak(items[next], () => startListening());
        }
      } else if (isNo) {
        const failed = items[idx];
        setFailedItem(failed);
        setPhase("safety_fail");
        speak(
          lang === "es"
            ? `Control de seguridad fallido. ${failed} Sesión detenida. Notifica a tu supervisor.`
            : `Safety check failed. ${failed} Session stopped. Notify your supervisor.`
        );
      } else {
        // Didn't understand — re-ask
        speak(items[idx], () => startListening());
      }
    }
  }, [lang, speak, startListening, navigate]); // eslint-disable-line

  // ── Load assignment ────────────────────────────────────────────────────────
  const loadAssignment = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await fetch("/api/assignments/mine", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!res.ok) throw new Error();
      const data: DbAssignment[] = await res.json();
      const mine = data.find(
        a => a.selectorUserId === currentUser?.id &&
             (a.status === "active" || a.status === "pending")
      );
      if (!mine) {
        setAssignment(null);
        setPhase("no_assignment");
        speak(
          lang === "es"
            ? "No hay turno asignado. Consulta con tu entrenador."
            : "No assignment available. Check with your trainer.",
        );
      } else {
        setAssignment(mine);
        assignmentRef.current = mine;
        setPhase("equip_enter");
        speak(
          lang === "es" ? "Ingresa el número de equipo." : "Enter equipment ID.",
        );
      }
    } catch {
      setPhase("no_assignment");
      speak(
        lang === "es"
          ? "No se pudo cargar el turno. Consulta con tu entrenador."
          : "Could not load assignment. Check with your trainer.",
      );
    }
  }, [jwtToken, currentUser, lang, speak]);

  // ── Tap gate: unlock TTS + start ──────────────────────────────────────────
  const handleTapStart = () => {
    // User gesture unlocks audio
    try {
      const u = new SpeechSynthesisUtterance("\u200B");
      u.volume = 0;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    } catch {}
    loadAssignment();
  };

  // ── Equipment ID submission ────────────────────────────────────────────────
  const handleEquipSubmit = () => {
    const id = equipInput.trim().replace(/\s+/g, "").toUpperCase();
    if (!id) return;
    setEquipId(id);
    equipIdRef.current = id;
    setPhase("equip_confirm");
    speak(
      lang === "es" ? `Confirma equipo ${id}.` : `Confirm equipment ${id}.`,
      () => startListening(),
    );
  };

  // ── Restart safety after fail ──────────────────────────────────────────────
  const handleRestartSafety = () => {
    setFailedItem("");
    setSafetyIdx(0);
    safetyIdxRef.current = 0;
    setPhase("safety");
    speak(safetyItems[0], () => startListening());
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const canMic = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070c12] text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60">
        <button
          onClick={() => navigate("/nova/assignments")}
          className="w-9 h-9 rounded-xl border border-slate-700 flex items-center justify-center hover:border-slate-500 transition"
        >
          <ChevronRight className="h-4 w-4 text-slate-400 rotate-180" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
          <Zap className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <p className="font-black text-white">Load Pick</p>
          <p className="text-slate-500 text-xs">ES3 Voice-Directed Picking</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8 max-w-md mx-auto w-full">

        {/* NOVA Orb */}
        <div className="relative flex items-center justify-center w-36 h-36">
          {isSpeaking && (
            <>
              <div className="absolute inset-0      rounded-full bg-yellow-400/20 animate-ping" style={{ animationDuration: "1.4s" }} />
              <div className="absolute inset-[-12px] rounded-full bg-yellow-400/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
            </>
          )}
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" style={{ animationDuration: "1.8s" }} />
          )}
          <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isSpeaking   ? "bg-yellow-400 scale-110 shadow-yellow-400/40"
            : isListening ? "bg-green-500/20 border-2 border-green-400"
            : phase === "all_clear" ? "bg-green-600/30 border-2 border-green-400"
            : phase === "safety_fail" ? "bg-red-500/20 border-2 border-red-400"
            : "bg-slate-800 border-2 border-slate-700"
          }`}>
            {isSpeaking    && <Volume2      className="h-12 w-12 text-slate-950" />}
            {isListening   && <Mic          className="h-12 w-12 text-green-400" />}
            {!isSpeaking && !isListening && phase === "all_clear"    && <CheckCircle2 className="h-12 w-12 text-green-400" />}
            {!isSpeaking && !isListening && phase === "safety_fail"  && <XCircle      className="h-12 w-12 text-red-400" />}
            {!isSpeaking && !isListening && phase === "loading"      && <Loader2      className="h-12 w-12 text-yellow-400 animate-spin" />}
            {!isSpeaking && !isListening && phase === "gate"         && <Zap          className="h-12 w-12 text-yellow-400" />}
            {!isSpeaking && !isListening && (phase === "equip_enter" || phase === "equip_confirm") && <ShieldCheck className="h-12 w-12 text-blue-400" />}
            {!isSpeaking && !isListening && phase === "safety"       && <ShieldCheck  className="h-12 w-12 text-yellow-400" />}
            {!isSpeaking && !isListening && phase === "no_assignment" && <Activity    className="h-12 w-12 text-slate-500" />}
          </div>
        </div>

        {/* Prompt text */}
        {prompt && phase !== "gate" && (
          <p className={`text-xl font-medium text-center leading-relaxed max-w-xs ${isSpeaking ? "text-white" : "text-slate-300"}`}>
            {prompt}
          </p>
        )}

        {/* ── GATE: tap to start ── */}
        {phase === "gate" && (
          <div className="flex flex-col items-center gap-4 w-full">
            <p className="text-slate-400 text-sm text-center">
              NOVA will guide you through the safety checklist before loading your picks.
            </p>
            <button
              onClick={handleTapStart}
              className="w-full py-5 rounded-3xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 active:scale-95 transition shadow-xl shadow-yellow-400/30 flex items-center justify-center gap-3"
            >
              <Zap className="h-6 w-6" />
              Tap to Start Load Pick
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <p className="text-slate-400 text-sm">Checking for your assignment…</p>
        )}

        {/* ── NO ASSIGNMENT ── */}
        {phase === "no_assignment" && (
          <div className="w-full space-y-4">
            <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-6 text-center space-y-3">
              <Activity className="h-10 w-10 text-yellow-400/60 mx-auto" />
              <p className="font-black text-yellow-300 text-lg">No Assignment Yet</p>
              <p className="text-slate-400 text-sm">
                Your trainer hasn't assigned a pick to you yet. Check back soon or speak to your trainer.
              </p>
            </div>
            <button
              onClick={() => {
                setPhase("gate");
                setPrompt("");
              }}
              className="w-full py-3 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:border-slate-500 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Check Again
            </button>
          </div>
        )}

        {/* ── EQUIPMENT ID ── */}
        {phase === "equip_enter" && !isSpeaking && (
          <div className="w-full space-y-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-1">
              <input
                type="text"
                value={equipInput}
                onChange={e => setEquipInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEquipSubmit()}
                placeholder="e.g. 0001"
                autoFocus
                className="w-full bg-transparent px-4 py-3 text-white text-xl font-black tracking-widest text-center placeholder:text-slate-600 outline-none"
              />
            </div>
            <button
              onClick={handleEquipSubmit}
              disabled={!equipInput.trim()}
              className="w-full py-4 rounded-2xl bg-yellow-400 text-slate-950 font-black text-lg hover:bg-yellow-300 active:scale-95 transition disabled:opacity-40"
            >
              Confirm Equipment ID
            </button>
          </div>
        )}

        {/* ── EQUIPMENT CONFIRM (voice) ── */}
        {phase === "equip_confirm" && !isSpeaking && (
          <div className="w-full space-y-3">
            {isListening ? (
              <p className="text-center text-green-400 text-sm font-bold animate-pulse">Listening… say Yes or No</p>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleVoiceInput("yes")}
                  className="flex-1 py-4 rounded-2xl bg-green-600 text-white font-black text-lg hover:bg-green-500 transition"
                >
                  ✓ Yes
                </button>
                <button
                  onClick={() => handleVoiceInput("no")}
                  className="flex-1 py-4 rounded-2xl border border-slate-600 text-slate-300 font-black text-lg hover:border-slate-400 transition"
                >
                  ✗ Re-enter
                </button>
              </div>
            )}
            {canMic && !isListening && (
              <button
                onClick={() => startListening()}
                className="w-full py-2 rounded-xl border border-slate-700 text-slate-400 text-sm flex items-center justify-center gap-2 hover:border-slate-500 transition"
              >
                <Mic className="h-4 w-4" /> Use voice to confirm
              </button>
            )}
          </div>
        )}

        {/* ── SAFETY CHECK ── */}
        {phase === "safety" && !isSpeaking && (
          <div className="w-full space-y-3">
            {/* Progress */}
            <div className="flex items-center gap-2 justify-center mb-2">
              {safetyItems.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${
                  i < safetyIdx ? "w-5 bg-green-400" : i === safetyIdx ? "w-7 bg-yellow-400" : "w-3 bg-slate-700"
                }`} />
              ))}
            </div>
            <p className="text-xs text-center text-slate-500 font-bold uppercase tracking-widest">
              Safety Check {safetyIdx + 1} / {safetyItems.length}
            </p>

            {isListening ? (
              <p className="text-center text-green-400 text-sm font-bold animate-pulse">Listening… say Yes or No</p>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleVoiceInput("yes")}
                  className="flex-1 py-5 rounded-2xl bg-green-600 text-white font-black text-xl hover:bg-green-500 active:scale-95 transition"
                >
                  ✓ Okay
                </button>
                <button
                  onClick={() => handleVoiceInput("no")}
                  className="flex-1 py-5 rounded-2xl bg-red-600/80 text-white font-black text-xl hover:bg-red-500 active:scale-95 transition"
                >
                  ✗ Fail
                </button>
              </div>
            )}
            {canMic && !isListening && (
              <button
                onClick={() => startListening()}
                className="w-full py-2 rounded-xl border border-slate-700 text-slate-400 text-sm flex items-center justify-center gap-2 hover:border-green-500/40 transition"
              >
                <Mic className="h-4 w-4" /> Use voice
              </button>
            )}
          </div>
        )}

        {/* ── SAFETY FAIL ── */}
        {phase === "safety_fail" && !isSpeaking && (
          <div className="w-full space-y-4">
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-center space-y-2">
              <XCircle className="h-8 w-8 text-red-400 mx-auto" />
              <p className="font-black text-red-300">Safety Check Failed</p>
              <p className="text-slate-400 text-sm">{failedItem}</p>
              <p className="text-slate-500 text-xs">Notify your supervisor before continuing.</p>
            </div>
            <button
              onClick={handleRestartSafety}
              className="w-full py-3 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:border-slate-500 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Restart Safety Check
            </button>
          </div>
        )}

        {/* ── ALL CLEAR / GOING ── */}
        {(phase === "all_clear" || phase === "going") && !isSpeaking && (
          <div className="w-full space-y-4">
            <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
              <p className="font-black text-green-300 text-lg">All Clear — Loading Assignment</p>
              {assignment && (
                <p className="text-slate-400 text-sm">
                  Aisles {assignment.startAisle}–{assignment.endAisle} · {assignment.totalCases} cases · Door {assignment.doorNumber}
                </p>
              )}
            </div>
            {assignment && (
              <button
                onClick={() => { setPhase("going"); navigate(`/nova/voice/${assignment.id}`); }}
                className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-lg hover:bg-green-500 active:scale-95 transition flex items-center justify-center gap-3"
              >
                <Zap className="h-5 w-5" /> Start Picking
              </button>
            )}
          </div>
        )}

      </div>

      {/* Mic status bar */}
      {isListening && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-full px-5 py-2.5">
          <Mic className="h-4 w-4 text-green-400 animate-pulse" />
          <span className="text-green-300 text-sm font-bold">Listening…</span>
          <button onClick={stopListening} className="ml-1">
            <MicOff className="h-4 w-4 text-green-400/60 hover:text-red-400 transition" />
          </button>
        </div>
      )}
    </div>
  );
}
