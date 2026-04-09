import type { ServerAssignment, ServerStop } from "./assignmentData.js";

export const PHASES = {
  WAIT_WAKE: "WAIT_WAKE",
  SIGN_ON_EQUIPMENT: "SIGN_ON_EQUIPMENT",
  CONFIRM_EQUIPMENT: "CONFIRM_EQUIPMENT",
  MAX_PALLET_COUNT: "MAX_PALLET_COUNT",
  CONFIRM_MAX_PALLET_COUNT: "CONFIRM_MAX_PALLET_COUNT",
  SAFETY: "SAFETY",
  WAIT_LOAD_PICKS: "WAIT_LOAD_PICKS",
  LOAD_SUMMARY: "LOAD_SUMMARY",
  SETUP_ALPHA: "SETUP_ALPHA",
  SETUP_BRAVO: "SETUP_BRAVO",
  PICK_CHECK: "PICK_CHECK",
  PICK_READY: "PICK_READY",
  COMPLETE_DOOR: "COMPLETE_DOOR",
  COMPLETE_ALPHA: "COMPLETE_ALPHA",
  COMPLETE_BRAVO: "COMPLETE_BRAVO",
  COMPLETE_STAGE_BRAVO: "COMPLETE_STAGE_BRAVO",
  COMPLETE_STAGE_ALPHA: "COMPLETE_STAGE_ALPHA",
  STOPPED: "STOPPED",
} as const;

export type Phase = (typeof PHASES)[keyof typeof PHASES];
export type Lang = "en" | "es";

// ── Safety items (bilingual) ───────────────────────────────────────────────────
const SAFETY_ITEMS: Record<Lang, string[]> = {
  en: [
    "Brakes okay?",
    "Battery guard okay?",
    "Horn okay?",
    "Wheels okay?",
    "Hydraulics okay?",
    "Controls okay?",
    "Steering okay?",
    "Welds okay?",
    "Electric wiring okay?",
  ],
  es: [
    "¿Frenos bien?",
    "¿Protector de batería bien?",
    "¿Bocina bien?",
    "¿Llantas bien?",
    "¿Hidráulicos bien?",
    "¿Controles bien?",
    "¿Dirección bien?",
    "¿Soldaduras bien?",
    "¿Cableado eléctrico bien?",
  ],
};

const DEFAULTS = {
  printerNumber: "307",
  alphaLabelNumber: "242",
  bravoLabelNumber: "578",
};

const WORD_DIGITS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  cero: "0", uno: "1", dos: "2", tres: "3", cuatro: "4",
  cinco: "5", seis: "6", siete: "7", ocho: "8", nueve: "9",
};

function normalize(input = "") {
  return input.toLowerCase().trim().replace(/[.,!?;:]+$/, "");
}

function digitsOnly(input = "") {
  const base = normalize(input);
  const wordConverted = base.split(/\s+/).map((w) => WORD_DIGITS[w] ?? w).join("");
  return wordConverted.replace(/[^0-9]/g, "");
}

function has(v: string, ...terms: string[]): boolean {
  return terms.some((t) => v.includes(t));
}

function isConfirm(input = "") {
  const v = normalize(input);
  return has(v,
    "yes", "yeah", "yep", "yea",
    "confirm", "correct", "affirmative",
    "that's", "thats", "right",
    "okay", "ok",
    "si ", "sí", " si",
    "sure", "go ahead", "proceed",
  ) || v === "si" || v === "sí";
}

function isDeny(input = "") {
  const v = normalize(input);
  return has(v, "no ", "nope", "cancel", "negative", "wrong", "incorrect", "redo") || v === "no";
}

function isLoadPicks(input = "") {
  const v = normalize(input);
  const hasLoadSound = has(v, "load", "lov", "lod", "lav", "lok", "lot pick", "lob", "lof", "lop");
  const hasPickSound = has(v, "pick", "pic ", "pik", " pic", "pec", "pek", "peak", "peek");
  if (hasLoadSound && hasPickSound) return true;
  if (has(v, "cargar", "selec", "carga", "cargar picks", "cargar pix")) return true;
  if (has(v, "lo", "la", "le") && has(v, "pic", "pik", "pec")) return true;
  return false;
}

function isReady(input = "") {
  const v = normalize(input);
  return has(v,
    "ready", "redy", "reddy", "rea",
    "listo", "lista", "listos",
    "done", "set", "go",
  );
}

function isWake(input = "") {
  const v = normalize(input);
  return has(v, "hey nova", "hey no", "hola nova", "hola no", "a nova", "ay nova");
}

function isStop(input = "") {
  const v = normalize(input);
  return has(v, "stop", "parar", "para", "halt", "end session", "terminar");
}

// ── Prompt builders (bilingual) ───────────────────────────────────────────────
function makePrompts(lang: Lang) {
  const es = lang === "es";
  return {
    waitWake:     es ? 'Di "Hola NOVA" para comenzar.'                            : 'Say "Hey NOVA" to begin.',
    noAssignment: es ? "No tienes ninguna asignación."                             : "No assignment assigned to your username.",
    enterEquip:   es ? "Ingresa el número de equipo."                              : "Enter equipment ID.",
    confirmEquip: (id: string) =>
                  es ? `Confirma equipo ${id}.`                                    : `Confirm equipment ${id}.`,
    enterMaxPallet: (id: string) =>
                  es ? `Ingresa la cantidad máxima de tarimas para el gato ${id}.` : `Enter maximum pallet count for jack ${id}.`,
    confirmMaxPallet: es ? "Confirma la cantidad máxima de tarimas."               : "Confirm maximum pallet count.",
    enterMaxPalletSimple: es ? "Ingresa la cantidad máxima de tarimas."            : "Enter maximum pallet count.",
    sayLoadPicks: es ? "Di cargar picks."                                          : "Say load picks.",
    toReady:      es ? "Para continuar di listo."                                  : "To continue say ready.",
    loadSummary:  (a: ServerAssignment) =>
                  es ? `Pasillo inicio ${a.startAisle} pasillo final ${a.endAisle}. ` +
                       `Total cajas ${a.totalCases}. Tarimas ${a.pallets}. ` +
                       `Meta estimada ${a.goalTimeMinutes} minutos. ` +
                       `Para continuar di listo.`
                     : `Start aisle ${a.startAisle} end aisle ${a.endAisle}. ` +
                       `Total cases ${a.totalCases}. Pallets ${a.pallets}. ` +
                       `Estimated goal ${a.goalTimeMinutes} minutes. ` +
                       `To continue say ready.`,
    posAlpha:     es ? "Coloca tarima alfa consigue chep."                         : "Position alpha pallet get chep.",
    posBravo:     es ? "Coloca tarima bravo consigue chep."                        : "Position bravo pallet get chep.",
    noStops:      es ? "No hay paradas encontradas."                               : "No stops found.",
    newAisle:     (stop: ServerStop) =>
                  es ? `Nuevo pasillo ${stop.aisle} posición ${stop.slot}`         : `New aisle ${stop.aisle} slot ${stop.slot}`,
    repeatAisle:  (stop: ServerStop) =>
                  es ? `Pasillo ${stop.aisle} posición ${stop.slot}`               : `Aisle ${stop.aisle} slot ${stop.slot}`,
    grab:         (stop: ServerStop, next: string) =>
                  es ? `Toma ${stop.qty}.${next}`                                  : `Grab ${stop.qty}.${next}`,
    nextAisle:    (stop: ServerStop) =>
                  es ? ` Pasillo ${stop.aisle} posición ${stop.slot}`              : ` Aisle ${stop.aisle} slot ${stop.slot}`,
    lastStop:     es ? " Última parada completa"                                   : " Last stop complete",
    invalid:      (said: string) =>
                  es ? `Dijiste ${said}. Inválido.`                                : `You said ${said}. Invalid.`,
    deliverBravo: (n: string | number) =>
                  es ? `Lote completo entrega tarima bravo a puerta ${n}`          : `Batch complete deliver pallet bravo to door ${n}`,
    applyAlpha:   es ? "Aplica etiquetas a tarima alfa"                            : "Apply labels to pallet alpha",
    applyBravo:   es ? "Aplica etiquetas a tarima bravo"                           : "Apply labels to pallet bravo",
    deliverBravoStage: (n: string | number) =>
                  es ? `Entrega tarima bravo a puerta ${n}`                        : `Deliver bravo pallet to door ${n}`,
    deliverAlphaStage: (n: string | number) =>
                  es ? `Entrega tarima alfa a puerta ${n}`                         : `Deliver alpha pallet to door ${n}`,
    stopped:      es ? 'NOVA detenido. Di "Hola NOVA" para activarme de nuevo.'    : 'NOVA stopped. Say "Hey NOVA" to wake me again.',
    safetyFailed: (item: string) =>
                  es ? `Fallo de seguridad. ${item} Sesión detenida.`              : `Safety failed. ${item} Session stopped.`,
  };
}

export interface Selector {
  userId: string;
  novaId: string;
  fullName?: string;
}

export interface CommandLogEntry {
  id: number;
  type: "NOVA" | "USER";
  text: string;
  at: string;
}

export interface TrainerSnapshot {
  selector: Selector;
  phase: Phase;
  prompt: string;
  equipmentId: string;
  maxPalletCount: string;
  failedSafetyItem: string;
  activeAssignment: ServerAssignment | null;
  currentStop: ServerStop | null;
  nextStop: ServerStop | null;
  invalidCount: number;
  commandLog: CommandLogEntry[];
  defaults: typeof DEFAULTS;
  lang: Lang;
  autoAdvance?: boolean;
  autoAdvanceDelayMs?: number;
}

export function createNovaTrainerSession({
  selector,
  assignments,
  assignmentStops,
  lang = "en",
}: {
  selector: Selector;
  assignments: ServerAssignment[];
  assignmentStops: Record<string, ServerStop[]>;
  lang?: Lang;
}) {
  const myAssignments = assignments.filter(
    (a) => !a.archived && a.selectorUserId === selector.userId
  );

  const P = makePrompts(lang);

  const state = {
    selector,
    phase: PHASES.WAIT_WAKE as Phase,
    prompt: P.waitWake,
    equipmentId: "",
    maxPalletCount: "2",
    safetyIndex: 0,
    failedSafetyItem: "",
    activeAssignmentId: null as string | null,
    currentStopIndex: 0,
    invalidCount: 0,
    commandLog: [] as CommandLogEntry[],
  };

  function log(type: "NOVA" | "USER", text: string) {
    state.commandLog.unshift({
      id: Date.now() + Math.random(),
      type,
      text,
      at: new Date().toISOString(),
    });
    if (state.commandLog.length > 80) {
      state.commandLog = state.commandLog.slice(0, 80);
    }
  }

  function currentAssignment(): ServerAssignment | null {
    return myAssignments.find((a) => a.id === state.activeAssignmentId) ?? null;
  }

  function currentStops(): ServerStop[] {
    const a = currentAssignment();
    if (!a) return [];
    return assignmentStops[a.assignmentNumber] ?? [];
  }

  function currentStop(): ServerStop | null {
    return currentStops()[state.currentStopIndex] ?? null;
  }

  function nextStop(): ServerStop | null {
    return currentStops()[state.currentStopIndex + 1] ?? null;
  }

  function setPrompt(text: string): TrainerSnapshot {
    state.prompt = text;
    log("NOVA", text);
    return snapshot();
  }

  function snapshot(): TrainerSnapshot {
    return {
      selector: state.selector,
      phase: state.phase,
      prompt: state.prompt,
      equipmentId: state.equipmentId,
      maxPalletCount: state.maxPalletCount,
      failedSafetyItem: state.failedSafetyItem,
      activeAssignment: currentAssignment(),
      currentStop: currentStop(),
      nextStop: nextStop(),
      invalidCount: state.invalidCount,
      commandLog: state.commandLog.slice(0, 40),
      defaults: DEFAULTS,
      lang,
    };
  }

  function startAssignedBatch(): TrainerSnapshot {
    const assignment = myAssignments[0];
    if (!assignment) {
      return setPrompt(P.noAssignment);
    }
    state.activeAssignmentId = assignment.id;
    state.currentStopIndex = 0;
    state.phase = PHASES.LOAD_SUMMARY;
    return setPrompt(P.loadSummary(assignment));
  }

  function moveToNextStop(): TrainerSnapshot {
    const stops = currentStops();
    if (state.currentStopIndex < stops.length - 1) {
      state.currentStopIndex += 1;
      state.phase = PHASES.PICK_CHECK;
      const stop = currentStop()!;
      return setPrompt(P.newAisle(stop));
    }
    state.phase = PHASES.COMPLETE_DOOR;
    const assignment = currentAssignment();
    return setPrompt(P.deliverBravo(assignment?.doorNumber ?? ""));
  }

  function handleWorkflowInput(rawInput = ""): TrainerSnapshot {
    if (rawInput === "__AUTO_NEXT__" && state.phase === PHASES.PICK_READY) {
      return moveToNextStop();
    }

    const input = normalize(rawInput);
    log("USER", rawInput || input);

    if (isStop(input)) {
      state.phase = PHASES.STOPPED;
      return setPrompt(P.stopped);
    }

    if (state.phase === PHASES.WAIT_WAKE || state.phase === PHASES.STOPPED) {
      if (isWake(input)) {
        state.phase = PHASES.SIGN_ON_EQUIPMENT;
        return setPrompt(P.enterEquip);
      }
      return snapshot();
    }

    if (state.phase === PHASES.SIGN_ON_EQUIPMENT) {
      const digits = digitsOnly(input);
      if (!digits) return setPrompt(P.enterEquip);
      state.equipmentId = digits;
      state.phase = PHASES.CONFIRM_EQUIPMENT;
      return setPrompt(P.confirmEquip(digits));
    }

    if (state.phase === PHASES.CONFIRM_EQUIPMENT) {
      if (isConfirm(input)) {
        state.phase = PHASES.MAX_PALLET_COUNT;
        return setPrompt(P.enterMaxPallet(state.equipmentId));
      }
      if (isDeny(input)) {
        state.equipmentId = "";
        state.phase = PHASES.SIGN_ON_EQUIPMENT;
        return setPrompt(P.enterEquip);
      }
      return setPrompt(P.confirmEquip(state.equipmentId));
    }

    if (state.phase === PHASES.MAX_PALLET_COUNT) {
      const digits = digitsOnly(input);
      if (!digits) return setPrompt(P.enterMaxPalletSimple);
      state.maxPalletCount = digits;
      state.phase = PHASES.CONFIRM_MAX_PALLET_COUNT;
      return setPrompt(P.confirmMaxPallet);
    }

    if (state.phase === PHASES.CONFIRM_MAX_PALLET_COUNT) {
      if (isConfirm(input)) {
        state.phase = PHASES.SAFETY;
        state.safetyIndex = 0;
        return setPrompt(SAFETY_ITEMS[lang][0]);
      }
      if (isDeny(input)) {
        state.phase = PHASES.MAX_PALLET_COUNT;
        return setPrompt(P.enterMaxPallet(state.equipmentId));
      }
      return setPrompt(P.confirmMaxPallet);
    }

    if (state.phase === PHASES.SAFETY) {
      const item = SAFETY_ITEMS[lang][state.safetyIndex];
      if (isConfirm(input)) {
        if (state.safetyIndex < SAFETY_ITEMS[lang].length - 1) {
          state.safetyIndex += 1;
          return setPrompt(SAFETY_ITEMS[lang][state.safetyIndex]);
        }
        state.phase = PHASES.WAIT_LOAD_PICKS;
        return setPrompt(P.sayLoadPicks);
      }
      if (isDeny(input)) {
        state.failedSafetyItem = item;
        state.phase = PHASES.STOPPED;
        return setPrompt(P.safetyFailed(item));
      }
      return setPrompt(item);
    }

    if (state.phase === PHASES.WAIT_LOAD_PICKS) {
      if (isLoadPicks(input)) return startAssignedBatch();
      return setPrompt(P.sayLoadPicks);
    }

    if (state.phase === PHASES.LOAD_SUMMARY) {
      if (isReady(input)) {
        state.phase = PHASES.SETUP_ALPHA;
        return setPrompt(P.posAlpha);
      }
      return setPrompt(P.toReady);
    }

    if (state.phase === PHASES.SETUP_ALPHA) {
      if (isReady(input)) {
        state.phase = PHASES.SETUP_BRAVO;
        return setPrompt(P.posBravo);
      }
      return setPrompt(P.posAlpha);
    }

    if (state.phase === PHASES.SETUP_BRAVO) {
      if (isReady(input)) {
        state.phase = PHASES.PICK_CHECK;
        const stop = currentStop();
        if (!stop) return setPrompt(P.noStops);
        return setPrompt(P.newAisle(stop));
      }
      return setPrompt(P.posBravo);
    }

    if (state.phase === PHASES.PICK_CHECK) {
      const stop = currentStop();
      if (!stop) return snapshot();

      if (input === "repeat" || input === "repite" || input === "repetir") {
        return setPrompt(P.repeatAisle(stop));
      }

      const digits = digitsOnly(input);
      if (!digits) {
        state.invalidCount += 1;
        return setPrompt(P.invalid(input || (lang === "es" ? "nada" : "nothing")));
      }
      if (digits !== stop.checkCode) {
        state.invalidCount += 1;
        return setPrompt(P.invalid(digits));
      }
      state.phase = PHASES.PICK_READY;
      const nextIndex = state.currentStopIndex + 1;
      const upNext = currentStops()[nextIndex] ?? null;
      const nextCall = upNext ? P.nextAisle(upNext) : P.lastStop;
      const prompt = P.grab(stop, nextCall);
      state.prompt = prompt;
      log("NOVA", prompt);
      return { ...snapshot(), autoAdvance: true, autoAdvanceDelayMs: 700 };
    }

    if (state.phase === PHASES.PICK_READY) {
      if (isReady(input) || isConfirm(input)) {
        return moveToNextStop();
      }
      if (input === "repeat" || input === "repite" || input === "repetir") {
        const stop = currentStop();
        if (stop) return setPrompt(P.repeatAisle(stop));
      }
      return snapshot();
    }

    if (state.phase === PHASES.COMPLETE_DOOR) {
      const assignment = currentAssignment();
      if (digitsOnly(input) === String(assignment?.doorCode ?? "")) {
        state.phase = PHASES.COMPLETE_ALPHA;
        return setPrompt(P.applyAlpha);
      }
      return setPrompt(P.deliverBravo(assignment?.doorNumber ?? ""));
    }

    if (state.phase === PHASES.COMPLETE_ALPHA) {
      const digits = digitsOnly(input);
      if (
        input.includes("alpha") ||
        input.includes("alfa") ||
        digits === DEFAULTS.alphaLabelNumber
      ) {
        state.phase = PHASES.COMPLETE_BRAVO;
        return setPrompt(P.applyBravo);
      }
      return setPrompt(P.applyAlpha);
    }

    if (state.phase === PHASES.COMPLETE_BRAVO) {
      const digits = digitsOnly(input);
      if (input.includes("bravo") || digits === DEFAULTS.bravoLabelNumber) {
        state.phase = PHASES.COMPLETE_STAGE_BRAVO;
        const assignment = currentAssignment();
        return setPrompt(P.deliverBravoStage(assignment?.doorNumber ?? ""));
      }
      return setPrompt(P.applyBravo);
    }

    if (state.phase === PHASES.COMPLETE_STAGE_BRAVO) {
      const assignment = currentAssignment();
      if (digitsOnly(input) === String(assignment?.doorCode ?? "")) {
        state.phase = PHASES.COMPLETE_STAGE_ALPHA;
        return setPrompt(P.deliverAlphaStage(assignment?.doorNumber ?? ""));
      }
      return setPrompt(P.deliverBravoStage(assignment?.doorNumber ?? ""));
    }

    if (state.phase === PHASES.COMPLETE_STAGE_ALPHA) {
      const assignment = currentAssignment();
      if (digitsOnly(input) === String(assignment?.doorCode ?? "")) {
        state.phase = PHASES.WAIT_LOAD_PICKS;
        return setPrompt(P.sayLoadPicks);
      }
      return setPrompt(P.deliverAlphaStage(assignment?.doorNumber ?? ""));
    }

    return snapshot();
  }

  return { snapshot, handleWorkflowInput };
}

export type NovaTrainerSession = ReturnType<typeof createNovaTrainerSession>;
