/**
 * NOVA Load Pick — Full ES3 Sign-On Flow
 *
 * 1. Tap gate
 * 2. NOVA says "Load Pick" → user says "Load Pick" back (or taps)
 * 3. "Enter equipment ID" → user types/speaks
 * 4. "Confirm equipment 0-0-0-1" → Confirm / Deny
 * 5. "Enter maximum pallet count for jack 0001" → user types/speaks
 * 6. "Confirm maximum pallet count 2" → Confirm / Deny
 * 7. Safety checks x9 → Confirm / Cancel each
 * 8. All clear → navigate to voice session
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

// ── Spell equipment ID digit-by-digit for TTS, e.g. "0001" → "0. 0. 0. 1" ──
function spellId(id: string) {
  return id.split("").join(". ");
}
// Display version: "0001" → "0-0-0-1"
function displayId(id: string) {
  return id.split("").join("-");
}

// ── Phase type ─────────────────────────────────────────────────────────────────
type Phase =
  | "gate"           // initial tap-to-unlock TTS
  | "loading"        // fetching assignment from API
  | "no_assignment"  // no active assignment found
  | "say_load_pick"  // NOVA says "Load Pick" — user must say it back
  | "equip_enter"    // user enters equipment ID (type or speak)
  | "equip_confirm"  // NOVA reads back ID digit-by-digit — Confirm / Deny
  | "pallet_enter"   // NOVA asks for max pallet count
  | "pallet_confirm" // NOVA reads back pallet count — Confirm / Deny
  | "safety"         // 9-item safety checklist
  | "safety_fail"    // one item failed
  | "all_clear"      // all checks passed
  | "going";         // navigating to voice session

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

// ── Practice assignment used when no real assignment is assigned ──────────────
const PRACTICE_ASSIGNMENT: DbAssignment = {
  id:               "practice",
  title:            "Practice Sign-On",
  totalCases:       20,
  startAisle:       1,
  endAisle:         10,
  goalTimeMinutes:  45,
  doorNumber:       1,
  totalPallets:     2,
  status:           "active",
  selectorUserId:   null,
};

// ── Button shared styles ──────────────────────────────────────────────────────
const btnConfirm = "flex-1 py-5 rounded-3xl bg-green-600 text-white font-black text-xl hover:bg-green-500 active:scale-95 transition select-none";
const btnDeny    = "flex-1 py-5 rounded-3xl bg-slate-800 border border-slate-600 text-slate-200 font-black text-xl hover:bg-slate-700 active:scale-95 transition select-none";

// ─────────────────────────────────────────────────────────────────────────────

export default function NovaLoadPickPage() {
  const [, navigate] = useLocation();
  const { currentUser, jwtToken } = useAuthStore();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const safetyItems = lang === "es" ? SAFETY_ES : SAFETY_EN;

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase,        setPhase]        = useState<Phase>("gate");
  const [prompt,       setPrompt]       = useState("");
  const [assignment,   setAssignment]   = useState<DbAssignment | null>(null);
  const [equipInput,   setEquipInput]   = useState("");
  const [equipId,      setEquipId]      = useState("");
  const [palletInput,  setPalletInput]  = useState("");
  const [palletCount,  setPalletCount]  = useState(0);
  const [safetyIdx,    setSafetyIdx]    = useState(0);
  const [failedItem,   setFailedItem]   = useState("");
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [isListening,  setIsListening]  = useState(false);

  // Refs for stale-closure safety
  const phaseRef       = useRef<Phase>("gate");
  const safetyIdxRef   = useRef(0);
  const equipIdRef     = useRef("");
  const palletCountRef = useRef(0);
  const assignmentRef  = useRef<DbAssignment | null>(null);
  const recRef         = useRef<any>(null);

  useEffect(() => { phaseRef.current      = phase;       }, [phase]);
  useEffect(() => { safetyIdxRef.current  = safetyIdx;   }, [safetyIdx]);
  useEffect(() => { equipIdRef.current    = equipId;     }, [equipId]);
  useEffect(() => { palletCountRef.current = palletCount; }, [palletCount]);
  useEffect(() => { assignmentRef.current = assignment;  }, [assignment]);

  // ── TTS helper ────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    setIsSpeaking(true);
    setPrompt(text);
    stopListening();
    novaSpeak(text, lang, () => {
      setIsSpeaking(false);
      onEnd?.();
    }, { rate: 0.9, pitch: 1 });
  }, [lang]); // eslint-disable-line

  // ── Speech recognition ────────────────────────────────────────────────────
  const stopListening = () => {
    try { recRef.current?.abort(); } catch {}
    recRef.current = null;
    setIsListening(false);
  };

  const startListening = useCallback((onResult: (heard: string) => void) => {
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
      onResult(heard);
    };

    recRef.current = rec;
    try { rec.start(); } catch {}
  }, [lang]); // eslint-disable-line

  // ── Shared helpers ────────────────────────────────────────────────────────
  const isYes = (s: string) => /yes|yeah|yep|okay|ok|confirm|correct|right|sure|si|sí|afirm/i.test(s);
  const isNo  = (s: string) => /\bno\b|nope|cancel|negative|wrong|fail|deny/i.test(s);

  const canMic = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

  // ── Phase transitions ─────────────────────────────────────────────────────

  // STEP 2 — Say "Load Pick"
  const startSayLoadPick = useCallback((a: DbAssignment) => {
    setPhase("say_load_pick");
    speak(lang === "es" ? "Cargar turno." : "Load Pick.", () => {
      startListening(heard => {
        if (/load.?pick|cargar|turno/i.test(heard)) {
          startEquipEnter();
        } else {
          // Re-prompt
          startSayLoadPick(a);
        }
      });
    });
  }, [lang]); // eslint-disable-line

  // STEP 3 — Enter equipment ID (voice: user speaks digits)
  const startEquipEnter = useCallback(() => {
    setPhase("equip_enter");
    speak(lang === "es" ? "Ingresa el número de equipo." : "Enter equipment ID.", () => {
      // After speaking, listen for spoken ID
      startListening(heard => {
        // Strip non-alphanumeric and uppercase
        const normalized = heard.replace(/\s+/g, "").replace(/[^a-z0-9]/gi, "").toUpperCase();
        if (normalized) {
          setEquipInput(normalized);
        }
        // Stay on equip_enter so user can see/edit and tap confirm
      });
    });
  }, [lang]); // eslint-disable-line

  // STEP 4 — Confirm equipment ID digit by digit
  const submitEquipId = useCallback((rawId: string) => {
    const id = rawId.trim().replace(/\s+/g, "").toUpperCase();
    if (!id) return;
    setEquipId(id);
    equipIdRef.current = id;
    setPhase("equip_confirm");

    const spokenId   = spellId(id);
    const msg = lang === "es"
      ? `Confirma equipo. ${spokenId}.`
      : `Confirm equipment. ${spokenId}.`;

    speak(msg, () => {
      startListening(heard => {
        if (isYes(heard)) {
          startPalletEnter(id);
        } else {
          // Deny — re-enter
          setEquipInput("");
          setEquipId("");
          equipIdRef.current = "";
          startEquipEnter();
        }
      });
    });
  }, [lang]); // eslint-disable-line

  // STEP 5 — Enter maximum pallet count
  const startPalletEnter = useCallback((eId: string) => {
    setPhase("pallet_enter");
    const msg = lang === "es"
      ? `Ingresa el conteo máximo de tarimas para el equipo ${spellId(eId)}.`
      : `Enter maximum pallet count for jack ${spellId(eId)}.`;

    speak(msg, () => {
      startListening(heard => {
        // Try to extract a number from what was heard
        const num = parseInt(heard.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && num > 0) {
          setPalletInput(String(num));
        }
        // Stay on pallet_enter so user can see/edit and tap confirm
      });
    });
  }, [lang]); // eslint-disable-line

  // STEP 6 — Confirm pallet count
  const submitPalletCount = useCallback((rawCount: string) => {
    const count = parseInt(rawCount, 10);
    if (isNaN(count) || count < 1) return;
    setPalletCount(count);
    palletCountRef.current = count;
    setPhase("pallet_confirm");

    const msg = lang === "es"
      ? `Confirma conteo máximo de tarimas. ${count}.`
      : `Confirm maximum pallet count. ${count}.`;

    speak(msg, () => {
      startListening(heard => {
        if (isYes(heard)) {
          startSafety();
        } else {
          // Deny — re-enter pallet count
          setPalletInput("");
          setPalletCount(0);
          startPalletEnter(equipIdRef.current);
        }
      });
    });
  }, [lang]); // eslint-disable-line

  // STEP 7 — Safety checks
  const startSafety = useCallback(() => {
    setSafetyIdx(0);
    safetyIdxRef.current = 0;
    setPhase("safety");
    const items = lang === "es" ? SAFETY_ES : SAFETY_EN;
    speak(items[0], () => listenSafety(0));
  }, [lang]); // eslint-disable-line

  const listenSafety = useCallback((idx: number) => {
    const items = lang === "es" ? SAFETY_ES : SAFETY_EN;
    startListening(heard => {
      if (isYes(heard)) {
        advanceSafety(idx);
      } else if (isNo(heard)) {
        failSafety(items[idx]);
      } else {
        // Re-ask the same item
        speak(items[idx], () => listenSafety(idx));
      }
    });
  }, [lang]); // eslint-disable-line

  const advanceSafety = useCallback((idx: number) => {
    const items = lang === "es" ? SAFETY_ES : SAFETY_EN;
    const next = idx + 1;
    if (next >= items.length) {
      // All passed
      finishSafety();
    } else {
      setSafetyIdx(next);
      safetyIdxRef.current = next;
      speak(items[next], () => listenSafety(next));
    }
  }, [lang]); // eslint-disable-line

  const failSafety = useCallback((item: string) => {
    setFailedItem(item);
    setPhase("safety_fail");
    speak(
      lang === "es"
        ? `Control fallido. ${item}. Notifica a tu supervisor.`
        : `Safety check failed. ${item}. Notify your supervisor.`
    );
  }, [lang]); // eslint-disable-line

  const finishSafety = useCallback(() => {
    const a = assignmentRef.current;
    setPhase("all_clear");
    const isPractice = a?.id === "practice";
    const msg = lang === "es"
      ? `Controles completados. ${isPractice ? "¡Excelente práctica! Ya conoces el proceso de arranque." : `Cargando turno. Pasillos ${a?.startAisle} al ${a?.endAisle}. ${a?.totalCases} cajas. Tiempo estimado ${a?.goalTimeMinutes ?? "?"} minutos.`}`
      : `All safety checks complete. ${isPractice ? "Excellent practice! You know the sign-on process now." : `Load Picks. Aisles ${a?.startAisle} through ${a?.endAisle}. ${a?.totalCases} cases. Goal time ${a?.goalTimeMinutes ?? "?"} minutes.`}`;
    speak(msg, () => {
      if (!isPractice && a) {
        setTimeout(() => { setPhase("going"); navigate(`/nova/voice/${a.id}`); }, 1000);
      }
    });
  }, [lang, navigate]); // eslint-disable-line

  // ── Load assignment from API ──────────────────────────────────────────────
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
            : "No assignment available. Check with your trainer."
        );
      } else {
        setAssignment(mine);
        assignmentRef.current = mine;
        startSayLoadPick(mine);
      }
    } catch {
      setPhase("no_assignment");
      speak(
        lang === "es"
          ? "No se pudo cargar el turno. Consulta con tu entrenador."
          : "Could not load assignment. Check with your trainer."
      );
    }
  }, [jwtToken, currentUser, lang, speak, startSayLoadPick]); // eslint-disable-line

  // ── Initial tap gate — unlocks TTS ────────────────────────────────────────
  const handleTapStart = () => {
    try {
      const u = new SpeechSynthesisUtterance("\u200B");
      u.volume = 0;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    } catch {}
    loadAssignment();
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  // Orb state
  const orbClass = isSpeaking
    ? "bg-yellow-400 scale-110 shadow-yellow-400/40"
    : isListening
    ? "bg-green-500/20 border-2 border-green-400"
    : phase === "all_clear"
    ? "bg-green-600/30 border-2 border-green-400"
    : phase === "safety_fail"
    ? "bg-red-500/20 border-2 border-red-400"
    : "bg-slate-800 border-2 border-slate-700";

  const orbIcon = isSpeaking ? (
    <Volume2 className="h-12 w-12 text-slate-950" />
  ) : isListening ? (
    <Mic className="h-12 w-12 text-green-400" />
  ) : phase === "loading" ? (
    <Loader2 className="h-12 w-12 text-yellow-400 animate-spin" />
  ) : phase === "all_clear" ? (
    <CheckCircle2 className="h-12 w-12 text-green-400" />
  ) : phase === "safety_fail" ? (
    <XCircle className="h-12 w-12 text-red-400" />
  ) : phase === "no_assignment" ? (
    <Activity className="h-12 w-12 text-slate-500" />
  ) : phase === "gate" ? (
    <Zap className="h-12 w-12 text-yellow-400" />
  ) : phase === "safety" ? (
    <ShieldCheck className="h-12 w-12 text-yellow-400" />
  ) : (
    <Hash className="h-12 w-12 text-blue-400" />
  );

  return (
    <div className="min-h-screen bg-[#070c12] text-white flex flex-col">

      {/* ── Header ── */}
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
          <p className="text-slate-500 text-xs">ES3 Voice-Directed Sign-On</p>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-7 max-w-sm mx-auto w-full">

        {/* NOVA Orb */}
        <div className="relative flex items-center justify-center w-36 h-36">
          {isSpeaking && (
            <>
              <div className="absolute inset-0       rounded-full bg-yellow-400/20 animate-ping" style={{ animationDuration: "1.4s" }} />
              <div className="absolute inset-[-12px] rounded-full bg-yellow-400/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
            </>
          )}
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" style={{ animationDuration: "1.8s" }} />
          )}
          <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${orbClass}`}>
            {orbIcon}
          </div>
        </div>

        {/* NOVA spoken prompt */}
        {prompt && phase !== "gate" && (
          <p className={`text-2xl font-black text-center leading-snug max-w-xs ${isSpeaking ? "text-yellow-300" : "text-white"}`}>
            {prompt}
          </p>
        )}

        {/* ───────────────────────────────────────────
            PHASE: gate
        ─────────────────────────────────────────── */}
        {phase === "gate" && (
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-slate-400 text-sm text-center leading-relaxed">
              NOVA will guide you through sign-on before loading your picks.
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

        {/* ───────────────────────────────────────────
            PHASE: loading
        ─────────────────────────────────────────── */}
        {phase === "loading" && (
          <p className="text-slate-500 text-sm animate-pulse">Checking for your assignment…</p>
        )}

        {/* ───────────────────────────────────────────
            PHASE: no_assignment
        ─────────────────────────────────────────── */}
        {phase === "no_assignment" && !isSpeaking && (
          <div className="w-full space-y-4">
            <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-6 text-center space-y-3">
              <Activity className="h-10 w-10 text-yellow-400/60 mx-auto" />
              <p className="font-black text-yellow-300 text-lg">No Assignment Yet</p>
              <p className="text-slate-400 text-sm">Your trainer hasn't assigned a pick to you. Check back soon.</p>
            </div>
            {/* Practice Mode — run the full sign-on without a real assignment */}
            <button
              onClick={() => {
                setAssignment(PRACTICE_ASSIGNMENT);
                assignmentRef.current = PRACTICE_ASSIGNMENT;
                startSayLoadPick(PRACTICE_ASSIGNMENT);
              }}
              className="w-full py-5 rounded-3xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 active:scale-95 transition flex items-center justify-center gap-3 shadow-xl shadow-yellow-400/20"
            >
              <Zap className="h-6 w-6" /> Practice Sign-On
            </button>
            <p className="text-slate-600 text-xs text-center">Practice the full ES3 sign-on flow without a real assignment.</p>
            <button
              onClick={() => { setPhase("gate"); setPrompt(""); }}
              className="w-full py-3 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:border-slate-500 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Check Again
            </button>
          </div>
        )}

        {/* ───────────────────────────────────────────
            PHASE: say_load_pick
            NOVA says "Load Pick" — user says it back
        ─────────────────────────────────────────── */}
        {phase === "say_load_pick" && !isSpeaking && (
          <div className="w-full space-y-3">
            {isListening ? (
              <p className="text-center text-green-400 font-bold animate-pulse text-sm">
                Listening… say "Load Pick"
              </p>
            ) : (
              <button
                onClick={() => startSayLoadPick(assignment!)}
                className="w-full py-4 rounded-3xl border border-slate-700 text-slate-300 font-bold hover:border-yellow-400/40 transition flex items-center justify-center gap-2"
              >
                <Mic className="h-5 w-5" /> Say "Load Pick"
              </button>
            )}
            <button
              onClick={startEquipEnter}
              className="w-full py-3 rounded-2xl bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300 active:scale-95 transition text-sm"
            >
              Tap to Confirm Load Pick
            </button>
          </div>
        )}

        {/* ───────────────────────────────────────────
            PHASE: equip_enter — type or voice
        ─────────────────────────────────────────── */}
        {phase === "equip_enter" && !isSpeaking && (
          <div className="w-full space-y-3">
            <label className="block text-xs text-slate-500 font-bold uppercase tracking-widest text-center">
              Equipment ID
            </label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-1">
              <input
                type="text"
                value={equipInput}
                onChange={e => setEquipInput(e.target.value.replace(/\s/g, "").toUpperCase())}
                onKeyDown={e => e.key === "Enter" && equipInput.trim() && submitEquipId(equipInput)}
                placeholder="e.g. 0001"
                autoFocus
                className="w-full bg-transparent px-4 py-3 text-white text-3xl font-black tracking-[0.3em] text-center placeholder:text-slate-700 outline-none"
              />
            </div>
            <button
              onClick={() => submitEquipId(equipInput)}
              disabled={!equipInput.trim()}
              className="w-full py-5 rounded-3xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 active:scale-95 transition disabled:opacity-40"
            >
              Confirm
            </button>
            {canMic && !isListening && (
              <button
                onClick={() => startListening(heard => {
                  const n = heard.replace(/\s+/g, "").replace(/[^a-z0-9]/gi, "").toUpperCase();
                  if (n) setEquipInput(n);
                })}
                className="w-full py-2 rounded-xl border border-slate-700 text-slate-400 text-sm flex items-center justify-center gap-2 hover:border-slate-500 transition"
              >
                <Mic className="h-4 w-4" /> Speak equipment ID
              </button>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────
            PHASE: equip_confirm
        ─────────────────────────────────────────── */}
        {phase === "equip_confirm" && !isSpeaking && (
          <div className="w-full space-y-4">
            {/* Large digit display */}
            <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/5 py-6 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Confirm Equipment</p>
              <p className="text-5xl font-black text-yellow-300 tracking-[0.4em]">{displayId(equipId)}</p>
            </div>

            {isListening ? (
              <p className="text-center text-green-400 text-sm font-bold animate-pulse">Listening… say Confirm or Deny</p>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => startPalletEnter(equipId)} className={btnConfirm}>
                  ✓ Confirm
                </button>
                <button onClick={() => { setEquipInput(""); setEquipId(""); equipIdRef.current = ""; startEquipEnter(); }} className={btnDeny}>
                  ✗ Deny
                </button>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────
            PHASE: pallet_enter
        ─────────────────────────────────────────── */}
        {phase === "pallet_enter" && !isSpeaking && (
          <div className="w-full space-y-3">
            <label className="block text-xs text-slate-500 font-bold uppercase tracking-widest text-center">
              Max Pallet Count — Jack {equipId}
            </label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-1">
              <input
                type="number"
                min="1"
                max="20"
                value={palletInput}
                onChange={e => setPalletInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && palletInput.trim() && submitPalletCount(palletInput)}
                placeholder="e.g. 2"
                autoFocus
                className="w-full bg-transparent px-4 py-3 text-white text-3xl font-black tracking-[0.3em] text-center placeholder:text-slate-700 outline-none"
              />
            </div>
            <button
              onClick={() => submitPalletCount(palletInput)}
              disabled={!palletInput.trim() || isNaN(parseInt(palletInput))}
              className="w-full py-5 rounded-3xl bg-yellow-400 text-slate-950 font-black text-xl hover:bg-yellow-300 active:scale-95 transition disabled:opacity-40"
            >
              Confirm
            </button>
            {canMic && !isListening && (
              <button
                onClick={() => startListening(heard => {
                  const num = parseInt(heard.replace(/[^0-9]/g, ""), 10);
                  if (!isNaN(num) && num > 0) setPalletInput(String(num));
                })}
                className="w-full py-2 rounded-xl border border-slate-700 text-slate-400 text-sm flex items-center justify-center gap-2 hover:border-slate-500 transition"
              >
                <Mic className="h-4 w-4" /> Speak pallet count
              </button>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────
            PHASE: pallet_confirm
        ─────────────────────────────────────────── */}
        {phase === "pallet_confirm" && !isSpeaking && (
          <div className="w-full space-y-4">
            <div className="rounded-3xl border border-blue-400/20 bg-blue-400/5 py-6 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Max Pallet Count</p>
              <p className="text-6xl font-black text-blue-300">{palletCount}</p>
              <p className="text-slate-500 text-sm mt-1">Jack {equipId}</p>
            </div>

            {isListening ? (
              <p className="text-center text-green-400 text-sm font-bold animate-pulse">Listening… say Confirm or Deny</p>
            ) : (
              <div className="flex gap-3">
                <button onClick={startSafety} className={btnConfirm}>
                  ✓ Confirm
                </button>
                <button onClick={() => { setPalletInput(""); setPalletCount(0); startPalletEnter(equipId); }} className={btnDeny}>
                  ✗ Deny
                </button>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────
            PHASE: safety
        ─────────────────────────────────────────── */}
        {phase === "safety" && !isSpeaking && (
          <div className="w-full space-y-4">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5">
              {safetyItems.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-300 ${
                  i < safetyIdx  ? "w-5 h-1.5 bg-green-400"
                  : i === safetyIdx ? "w-7 h-2 bg-yellow-400"
                  : "w-3 h-1.5 bg-slate-700"
                }`} />
              ))}
            </div>

            <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
              Safety {safetyIdx + 1} / {safetyItems.length}
            </p>

            {isListening ? (
              <p className="text-center text-green-400 text-sm font-bold animate-pulse">
                Listening… say Confirm or Cancel
              </p>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => advanceSafety(safetyIdx)} className={btnConfirm}>
                  ✓ Confirm
                </button>
                <button onClick={() => failSafety(safetyItems[safetyIdx])} className={`${btnDeny} border-red-500/40 text-red-300`}>
                  ✗ Cancel
                </button>
              </div>
            )}

            {canMic && !isListening && (
              <button
                onClick={() => listenSafety(safetyIdx)}
                className="w-full py-2 rounded-xl border border-slate-700 text-slate-500 text-xs flex items-center justify-center gap-2 hover:border-green-500/30 transition"
              >
                <Mic className="h-3.5 w-3.5" /> Use voice
              </button>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────
            PHASE: safety_fail
        ─────────────────────────────────────────── */}
        {phase === "safety_fail" && !isSpeaking && (
          <div className="w-full space-y-4">
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-2">
              <XCircle className="h-10 w-10 text-red-400 mx-auto" />
              <p className="font-black text-red-300 text-lg">Safety Check Failed</p>
              <p className="text-slate-300 text-sm font-medium">{failedItem}</p>
              <p className="text-slate-500 text-xs">Notify your supervisor before continuing.</p>
            </div>
            <button
              onClick={() => { setFailedItem(""); startSafety(); }}
              className="w-full py-3 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:border-slate-500 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Restart Safety Check
            </button>
          </div>
        )}

        {/* ───────────────────────────────────────────
            PHASE: all_clear / going
        ─────────────────────────────────────────── */}
        {(phase === "all_clear" || phase === "going") && !isSpeaking && (
          <div className="w-full space-y-4">
            {assignment?.id === "practice" ? (
              /* ── Practice Complete ── */
              <>
                <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
                  <p className="font-black text-green-300 text-lg">Practice Complete!</p>
                  <p className="text-slate-400 text-sm">You passed all 9 safety checks. Great job going through the full sign-on.</p>
                </div>
                <button
                  onClick={() => {
                    setPhase("gate");
                    setPrompt("");
                    setAssignment(null);
                    assignmentRef.current = null;
                    setEquipId("");
                    setEquipInput("");
                    setPalletInput("");
                    setPalletCount(0);
                    setSafetyIdx(0);
                  }}
                  className="w-full py-5 rounded-3xl border border-slate-700 text-slate-300 font-black text-xl hover:border-yellow-400/40 hover:text-white active:scale-95 transition flex items-center justify-center gap-3"
                >
                  <RefreshCw className="h-6 w-6" /> Practice Again
                </button>
              </>
            ) : (
              /* ── Real assignment ── */
              <>
                <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
                  <p className="font-black text-green-300 text-lg">All Clear — Loading Picks</p>
                  {assignment && (
                    <p className="text-slate-400 text-sm">
                      Aisles {assignment.startAisle}–{assignment.endAisle} · {assignment.totalCases} cases · Door {assignment.doorNumber}
                    </p>
                  )}
                </div>
                {assignment && (
                  <button
                    onClick={() => { setPhase("going"); navigate(`/nova/voice/${assignment.id}`); }}
                    className="w-full py-5 rounded-3xl bg-green-600 text-white font-black text-xl hover:bg-green-500 active:scale-95 transition flex items-center justify-center gap-3"
                  >
                    <Zap className="h-6 w-6" /> Start Picking
                  </button>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {/* ── Floating mic bar ── */}
      {isListening && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-full px-5 py-2.5 backdrop-blur-sm">
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
