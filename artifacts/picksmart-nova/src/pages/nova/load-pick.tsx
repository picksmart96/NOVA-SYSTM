/**
 * NOVA Load Pick — Full ES3 Sign-On Flow
 *
 * Buttons are ALWAYS visible — mic is a bonus, never a blocker.
 * Tap "Tap to Start Load Pick" once → everything else runs with taps.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { novaSpeak, novaRecogLang } from "@/lib/novaSpeech";
import { useTranslation } from "react-i18next";
import {
  Zap, ShieldCheck, Mic, MicOff, ChevronRight,
  Activity, CheckCircle2, XCircle, Loader2, Volume2, RefreshCw, Hash,
} from "lucide-react";

// ── Safety items ──────────────────────────────────────────────────────────────
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

// Spell ID digit-by-digit for TTS:  "0001" → "0. 0. 0. 1"
function spellId(id: string) { return id.split("").join(". "); }
// Display on screen:               "0001" → "0-0-0-1"
function displayId(id: string) { return id.split("").join("-"); }

// ── Phase ─────────────────────────────────────────────────────────────────────
type Phase =
  | "gate"
  | "loading"
  | "say_load_pick"
  | "equip_enter"
  | "equip_confirm"
  | "pallet_enter"
  | "pallet_confirm"
  | "safety"
  | "safety_fail"
  | "all_clear"
  | "going";

interface Asgn {
  id: string; title: string; totalCases: number; startAisle: number;
  endAisle: number; goalTimeMinutes: number | null; doorNumber: number;
  totalPallets: number | null; status: string; selectorUserId: string | null;
}

const PRACTICE: Asgn = {
  id: "practice", title: "Practice Sign-On", totalCases: 20,
  startAisle: 1, endAisle: 10, goalTimeMinutes: 45, doorNumber: 1,
  totalPallets: 2, status: "active", selectorUserId: null,
};

// ── Shared button styles ──────────────────────────────────────────────────────
const btnGreen = "flex-1 py-5 rounded-3xl bg-green-600 text-white font-black text-xl hover:bg-green-500 active:scale-95 transition";
const btnGray  = "flex-1 py-5 rounded-3xl bg-slate-800 border border-slate-600 text-slate-200 font-black text-xl hover:bg-slate-700 active:scale-95 transition";
const btnRed   = "flex-1 py-5 rounded-3xl bg-red-700/80 border border-red-500/40 text-white font-black text-xl hover:bg-red-600 active:scale-95 transition";

// ─────────────────────────────────────────────────────────────────────────────

export default function NovaLoadPickPage() {
  const [, navigate]  = useLocation();
  const { currentUser, jwtToken } = useAuthStore();
  const { i18n }      = useTranslation();
  const lang          = i18n.language?.startsWith("es") ? "es" : "en";
  const safetyItems   = lang === "es" ? SAFETY_ES : SAFETY_EN;

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase,       setPhase]       = useState<Phase>("gate");
  const [prompt,      setPrompt]      = useState("");
  const [asgn,        setAsgn]        = useState<Asgn | null>(null);
  const [equipInput,  setEquipInput]  = useState("");
  const [equipId,     setEquipId]     = useState("");
  const [palletInput, setPalletInput] = useState("");
  const [palletCount, setPalletCount] = useState(0);
  const [safetyIdx,   setSafetyIdx]   = useState(0);
  const [failedItem,  setFailedItem]  = useState("");
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micLabel,    setMicLabel]    = useState("");   // hint shown under mic indicator

  const phaseRef    = useRef<Phase>("gate");
  const asgnRef     = useRef<Asgn | null>(null);
  const equipIdRef  = useRef("");
  const safetyRef   = useRef(0);
  const recRef      = useRef<any>(null);

  useEffect(() => { phaseRef.current  = phase;      }, [phase]);
  useEffect(() => { asgnRef.current   = asgn;       }, [asgn]);
  useEffect(() => { equipIdRef.current = equipId;   }, [equipId]);
  useEffect(() => { safetyRef.current = safetyIdx;  }, [safetyIdx]);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    setIsSpeaking(true);
    setPrompt(text);
    stopListening();
    novaSpeak(text, lang, () => {
      setIsSpeaking(false);
      onEnd?.();
    }, { rate: 0.9, pitch: 1 });
  }, [lang]); // eslint-disable-line

  // ── Mic ────────────────────────────────────────────────────────────────────
  const stopListening = () => {
    try { recRef.current?.abort(); } catch {}
    recRef.current = null;
    setIsListening(false);
  };

  const startListening = useCallback((hint: string, onResult: (s: string) => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    stopListening();
    const rec = new SR();
    rec.continuous     = false;
    rec.interimResults = false;
    rec.lang           = novaRecogLang(lang);
    rec.onstart  = () => { setIsListening(true); setMicLabel(hint); };
    rec.onend    = () => { setIsListening(false); recRef.current = null; };
    rec.onerror  = () => { setIsListening(false); recRef.current = null; };
    rec.onresult = (e: any) => {
      const heard = (e.results?.[0]?.[0]?.transcript || "").toLowerCase().trim();
      onResult(heard);
    };
    recRef.current = rec;
    try { rec.start(); } catch {}
  }, [lang]); // eslint-disable-line

  const isYes = (s: string) => /yes|yeah|yep|okay|ok|confirm|correct|right|sure|si|sí|afirm/i.test(s);
  const isNo  = (s: string) => /\bno\b|nope|cancel|negative|wrong|fail|deny/i.test(s);

  // ── Steps ──────────────────────────────────────────────────────────────────

  const doSayLoadPick = useCallback((a: Asgn) => {
    setPhase("say_load_pick");
    speak(lang === "es" ? "Cargar turno." : "Load Pick.", () => {
      startListening(lang === "es" ? `Di "Cargar Turno"` : `Say "Load Pick"`, heard => {
        if (/load.?pick|cargar|turno/i.test(heard)) doEquipEnter();
        else doSayLoadPick(a);
      });
    });
  }, [lang]); // eslint-disable-line

  const doEquipEnter = useCallback(() => {
    setPhase("equip_enter");
    speak(lang === "es" ? "Ingresa el número de equipo." : "Enter equipment ID.", () => {
      startListening(lang === "es" ? "Di el número de equipo" : "Speak equipment ID", heard => {
        const n = heard.replace(/\s+/g, "").replace(/[^a-z0-9]/gi, "").toUpperCase();
        if (n) setEquipInput(n);
      });
    });
  }, [lang]); // eslint-disable-line

  const submitEquip = useCallback((raw: string) => {
    const id = raw.trim().replace(/\s+/g, "").toUpperCase();
    if (!id) return;
    setEquipId(id);
    equipIdRef.current = id;
    setPhase("equip_confirm");
    speak(
      lang === "es" ? `Confirma equipo. ${spellId(id)}.` : `Confirm equipment. ${spellId(id)}.`,
      () => startListening("Yes / No", heard => {
        if (isYes(heard)) doPalletEnter(id);
        else { setEquipInput(""); setEquipId(""); equipIdRef.current = ""; doEquipEnter(); }
      })
    );
  }, [lang]); // eslint-disable-line

  const doPalletEnter = useCallback((eId: string) => {
    setPhase("pallet_enter");
    speak(
      lang === "es"
        ? `Ingresa el conteo máximo de tarimas para el equipo ${spellId(eId)}.`
        : `Enter maximum pallet count for jack ${spellId(eId)}.`,
      () => startListening(lang === "es" ? "Di el número de tarimas" : "Speak number of pallets", heard => {
        const num = parseInt(heard.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && num > 0) setPalletInput(String(num));
      })
    );
  }, [lang]); // eslint-disable-line

  const submitPallet = useCallback((raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 1) return;
    setPalletCount(n);
    setPhase("pallet_confirm");
    speak(
      lang === "es" ? `Confirma conteo de tarimas. ${n}.` : `Confirm maximum pallet count. ${n}.`,
      () => startListening("Yes / No", heard => {
        if (isYes(heard)) doSafety(0);
        else { setPalletInput(""); setPalletCount(0); doPalletEnter(equipIdRef.current); }
      })
    );
  }, [lang]); // eslint-disable-line

  const doSafety = useCallback((idx: number) => {
    setSafetyIdx(idx);
    safetyRef.current = idx;
    setPhase("safety");
    const items = lang === "es" ? SAFETY_ES : SAFETY_EN;
    speak(items[idx], () => {
      startListening("Yes / No", heard => {
        if (isYes(heard)) advanceSafety(idx);
        else if (isNo(heard)) doFail(items[idx]);
        else doSafety(idx);
      });
    });
  }, [lang]); // eslint-disable-line

  const advanceSafety = useCallback((idx: number) => {
    const items = lang === "es" ? SAFETY_ES : SAFETY_EN;
    if (idx + 1 >= items.length) doAllClear();
    else doSafety(idx + 1);
  }, [lang]); // eslint-disable-line

  const doFail = useCallback((item: string) => {
    setFailedItem(item);
    setPhase("safety_fail");
    speak(
      lang === "es"
        ? `Control fallido. ${item}. Notifica a tu supervisor.`
        : `Safety check failed. ${item}. Notify your supervisor.`
    );
  }, [lang]); // eslint-disable-line

  const doAllClear = useCallback(() => {
    const a = asgnRef.current;
    setPhase("all_clear");
    const isPractice = a?.id === "practice";
    speak(
      lang === "es"
        ? `Controles completados. ${isPractice ? "¡Excelente práctica!" : `Cargando turno. Pasillos ${a?.startAisle} al ${a?.endAisle}.`}`
        : `All safety checks complete. ${isPractice ? "Excellent practice run!" : `Load Picks. Aisles ${a?.startAisle} through ${a?.endAisle}.`}`,
      () => {
        if (!isPractice && a) {
          setTimeout(() => { setPhase("going"); navigate(`/nova/voice/${a.id}`); }, 1000);
        }
      }
    );
  }, [lang, navigate]); // eslint-disable-line

  // ── Load from API ─────────────────────────────────────────────────────────
  const loadAssignment = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await fetch("/api/assignments/mine", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data: Asgn[] = res.ok ? await res.json() : [];
      const mine = data.find(
        a => a.selectorUserId === currentUser?.id &&
             (a.status === "active" || a.status === "pending")
      );
      if (mine) {
        setAsgn(mine);
        asgnRef.current = mine;
        doSayLoadPick(mine);
      } else {
        // No real assignment — auto-start practice mode
        setAsgn(PRACTICE);
        asgnRef.current = PRACTICE;
        doSayLoadPick(PRACTICE);
      }
    } catch {
      // Fallback to practice mode on error
      setAsgn(PRACTICE);
      asgnRef.current = PRACTICE;
      doSayLoadPick(PRACTICE);
    }
  }, [jwtToken, currentUser, doSayLoadPick]); // eslint-disable-line

  // ── Gate tap — unlocks audio ──────────────────────────────────────────────
  const handleTapStart = () => {
    try {
      const u = new SpeechSynthesisUtterance("\u200B");
      u.volume = 0;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    } catch {}
    loadAssignment();
  };

  // ── Reset helper ──────────────────────────────────────────────────────────
  const resetAll = () => {
    stopListening();
    setPhase("gate");
    setPrompt("");
    setAsgn(null);
    asgnRef.current = null;
    setEquipInput("");
    setEquipId("");
    setPalletInput("");
    setPalletCount(0);
    setSafetyIdx(0);
    setFailedItem("");
  };

  // ── Orb ───────────────────────────────────────────────────────────────────
  const orbColor =
    isSpeaking          ? "bg-yellow-400 scale-110 shadow-yellow-400/50"
    : isListening       ? "bg-green-500/20 border-2 border-green-400"
    : phase === "all_clear" ? "bg-green-600/30 border-2 border-green-400"
    : phase === "safety_fail" ? "bg-red-500/20 border-2 border-red-400"
    : "bg-slate-800 border-2 border-slate-700";

  const orbIcon =
    isSpeaking                               ? <Volume2    className="h-12 w-12 text-slate-950" />
    : isListening                            ? <Mic        className="h-12 w-12 text-green-400" />
    : phase === "loading"                    ? <Loader2    className="h-12 w-12 text-yellow-400 animate-spin" />
    : phase === "all_clear"                  ? <CheckCircle2 className="h-12 w-12 text-green-400" />
    : phase === "safety_fail"                ? <XCircle    className="h-12 w-12 text-red-400" />
    : phase === "gate"                       ? <Zap        className="h-12 w-12 text-yellow-400" />
    : phase === "safety"                     ? <ShieldCheck className="h-12 w-12 text-yellow-400" />
    : (phase === "equip_enter" || phase === "equip_confirm") ? <Hash className="h-12 w-12 text-blue-400" />
    : <Activity className="h-12 w-12 text-slate-500" />;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070c12] text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60">
        <button onClick={() => navigate("/nova/assignments")}
          className="w-9 h-9 rounded-xl border border-slate-700 flex items-center justify-center hover:border-slate-500 transition">
          <ChevronRight className="h-4 w-4 text-slate-400 rotate-180" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
          <Zap className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <p className="font-black text-white">Load Pick</p>
          <p className="text-slate-500 text-xs">ES3 Sign-On · Tap buttons to advance</p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6 max-w-sm mx-auto w-full">

        {/* Orb */}
        <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
          {isSpeaking && (
            <>
              <div className="absolute inset-0       rounded-full bg-yellow-400/20 animate-ping" style={{ animationDuration: "1.4s" }} />
              <div className="absolute inset-[-12px] rounded-full bg-yellow-400/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
            </>
          )}
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" style={{ animationDuration: "1.8s" }} />
          )}
          <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${orbColor}`}>
            {orbIcon}
          </div>
        </div>

        {/* Mic listening badge — small, never hides buttons */}
        {isListening && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5">
            <Mic className="h-3.5 w-3.5 text-green-400 animate-pulse" />
            <span className="text-green-300 text-xs font-bold">{micLabel || "Listening…"}</span>
            <button onClick={stopListening} className="ml-1">
              <MicOff className="h-3.5 w-3.5 text-green-500/60 hover:text-red-400 transition" />
            </button>
          </div>
        )}

        {/* NOVA spoken prompt */}
        {prompt && phase !== "gate" && (
          <p className={`text-2xl font-black text-center leading-snug max-w-xs ${isSpeaking ? "text-yellow-300" : "text-white"}`}>
            {prompt}
          </p>
        )}

        {/* ── GATE ── */}
        {phase === "gate" && (
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-slate-400 text-sm text-center leading-relaxed">
              Tap below — NOVA will guide you through each sign-on step. Tap the buttons to answer at every step.
            </p>
            <button onClick={handleTapStart}
              className="w-full py-5 rounded-3xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 active:scale-95 transition shadow-xl shadow-yellow-400/30 flex items-center justify-center gap-3">
              <Zap className="h-6 w-6" /> Tap to Start Load Pick
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <p className="text-slate-500 text-sm animate-pulse">Checking your assignment…</p>
        )}

        {/* ── SAY LOAD PICK ── */}
        {phase === "say_load_pick" && (
          <div className="w-full space-y-3">
            <p className="text-slate-500 text-xs text-center font-bold uppercase tracking-widest">Say it back to NOVA</p>
            {/* Always visible tap button */}
            <button onClick={() => { stopListening(); doEquipEnter(); }}
              className="w-full py-5 rounded-3xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 active:scale-95 transition shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-3">
              <Zap className="h-6 w-6" /> Load Pick ✓
            </button>
          </div>
        )}

        {/* ── EQUIPMENT ENTER ── */}
        {phase === "equip_enter" && (
          <div className="w-full space-y-3">
            <label className="block text-xs text-slate-500 font-bold uppercase tracking-widest text-center">Equipment ID</label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-1">
              <input
                type="text"
                value={equipInput}
                onChange={e => setEquipInput(e.target.value.replace(/\s/g, "").toUpperCase())}
                onKeyDown={e => e.key === "Enter" && equipInput.trim() && submitEquip(equipInput)}
                placeholder="e.g. 0001"
                autoFocus
                className="w-full bg-transparent px-4 py-3 text-white text-3xl font-black tracking-[0.3em] text-center placeholder:text-slate-700 outline-none"
              />
            </div>
            <button onClick={() => submitEquip(equipInput)} disabled={!equipInput.trim()}
              className="w-full py-5 rounded-3xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 active:scale-95 transition disabled:opacity-40">
              Confirm Equipment ID
            </button>
          </div>
        )}

        {/* ── EQUIPMENT CONFIRM ── */}
        {phase === "equip_confirm" && (
          <div className="w-full space-y-4">
            <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/5 py-6 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Confirm Equipment</p>
              <p className="text-5xl font-black text-yellow-300 tracking-[0.4em]">{displayId(equipId)}</p>
            </div>
            {/* ALWAYS show buttons — mic is just a bonus */}
            <div className="flex gap-3">
              <button onClick={() => { stopListening(); doPalletEnter(equipId); }} className={btnGreen}>
                ✓ Confirm
              </button>
              <button onClick={() => { stopListening(); setEquipInput(""); setEquipId(""); equipIdRef.current = ""; doEquipEnter(); }} className={btnGray}>
                ✗ Deny
              </button>
            </div>
          </div>
        )}

        {/* ── PALLET ENTER ── */}
        {phase === "pallet_enter" && (
          <div className="w-full space-y-3">
            <label className="block text-xs text-slate-500 font-bold uppercase tracking-widest text-center">
              Max Pallets — Jack {equipId}
            </label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-1">
              <input
                type="number" min="1" max="20"
                value={palletInput}
                onChange={e => setPalletInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && palletInput.trim() && submitPallet(palletInput)}
                placeholder="e.g. 2"
                autoFocus
                className="w-full bg-transparent px-4 py-3 text-white text-3xl font-black tracking-[0.3em] text-center placeholder:text-slate-700 outline-none"
              />
            </div>
            <button onClick={() => submitPallet(palletInput)}
              disabled={!palletInput.trim() || isNaN(parseInt(palletInput))}
              className="w-full py-5 rounded-3xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 active:scale-95 transition disabled:opacity-40">
              Confirm Pallet Count
            </button>
          </div>
        )}

        {/* ── PALLET CONFIRM ── */}
        {phase === "pallet_confirm" && (
          <div className="w-full space-y-4">
            <div className="rounded-3xl border border-blue-400/20 bg-blue-400/5 py-6 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Max Pallet Count</p>
              <p className="text-6xl font-black text-blue-300">{palletCount}</p>
              <p className="text-slate-500 text-sm mt-1">Jack {equipId}</p>
            </div>
            {/* ALWAYS show buttons */}
            <div className="flex gap-3">
              <button onClick={() => { stopListening(); doSafety(0); }} className={btnGreen}>
                ✓ Confirm
              </button>
              <button onClick={() => { stopListening(); setPalletInput(""); setPalletCount(0); doPalletEnter(equipId); }} className={btnGray}>
                ✗ Deny
              </button>
            </div>
          </div>
        )}

        {/* ── SAFETY CHECK ── */}
        {phase === "safety" && (
          <div className="w-full space-y-4">
            {/* Progress bar */}
            <div className="flex items-center justify-center gap-1.5">
              {safetyItems.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-300 ${
                  i < safetyIdx      ? "w-5 h-1.5 bg-green-400"
                  : i === safetyIdx  ? "w-7 h-2   bg-yellow-400"
                  :                    "w-3 h-1.5 bg-slate-700"
                }`} />
              ))}
            </div>
            <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
              Safety {safetyIdx + 1} / {safetyItems.length}
            </p>
            {/* Safety item name — always shown */}
            <p className="text-center text-white text-xl font-black">{safetyItems[safetyIdx]}</p>
            {/* ALWAYS show Confirm/Cancel buttons */}
            <div className="flex gap-3">
              <button onClick={() => { stopListening(); advanceSafety(safetyIdx); }} className={btnGreen}>
                ✓ Confirm
              </button>
              <button onClick={() => { stopListening(); doFail(safetyItems[safetyIdx]); }} className={btnRed}>
                ✗ Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── SAFETY FAIL ── */}
        {phase === "safety_fail" && (
          <div className="w-full space-y-4">
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-2">
              <XCircle className="h-10 w-10 text-red-400 mx-auto" />
              <p className="font-black text-red-300 text-lg">Safety Check Failed</p>
              <p className="text-slate-300 text-sm font-medium">{failedItem}</p>
              <p className="text-slate-500 text-xs">Notify your supervisor before continuing.</p>
            </div>
            <button onClick={() => { setFailedItem(""); doSafety(0); }}
              className="w-full py-3 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:border-slate-500 transition flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" /> Restart Safety Check
            </button>
          </div>
        )}

        {/* ── ALL CLEAR ── */}
        {(phase === "all_clear" || phase === "going") && (
          <div className="w-full space-y-4">
            {asgn?.id === "practice" ? (
              <>
                <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
                  <p className="font-black text-green-300 text-xl">Practice Complete!</p>
                  <p className="text-slate-400 text-sm">You completed the full ES3 sign-on. All 9 safety checks passed.</p>
                </div>
                <button onClick={resetAll}
                  className="w-full py-5 rounded-3xl border border-slate-700 text-slate-300 font-black text-xl hover:border-yellow-400/40 hover:text-white active:scale-95 transition flex items-center justify-center gap-3">
                  <RefreshCw className="h-6 w-6" /> Practice Again
                </button>
              </>
            ) : (
              <>
                <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
                  <p className="font-black text-green-300 text-xl">All Clear — Load Picks</p>
                  {asgn && (
                    <p className="text-slate-400 text-sm">
                      Aisles {asgn.startAisle}–{asgn.endAisle} · {asgn.totalCases} cases · Door {asgn.doorNumber}
                    </p>
                  )}
                </div>
                {asgn && (
                  <button onClick={() => { setPhase("going"); navigate(`/nova/voice/${asgn.id}`); }}
                    className="w-full py-5 rounded-3xl bg-green-600 text-white font-black text-xl hover:bg-green-500 active:scale-95 transition flex items-center justify-center gap-3">
                    <Zap className="h-6 w-6" /> Start Picking
                  </button>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
