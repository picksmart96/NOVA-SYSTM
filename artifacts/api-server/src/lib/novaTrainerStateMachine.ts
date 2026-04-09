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

const SAFETY_ITEMS = [
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
  // First try replacing number words with digits
  const wordConverted = base.split(/\s+/).map((w) => WORD_DIGITS[w] ?? w).join("");
  return wordConverted.replace(/[^0-9]/g, "");
}

/** Returns true if v contains any of the given substrings */
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
    "si ", "sí", " si",          // "si" with space to avoid false "visiting"
    "sure", "go ahead", "proceed",
  ) || v === "si" || v === "sí";
}

function isDeny(input = "") {
  const v = normalize(input);
  return has(v, "no ", "nope", "cancel", "negative", "wrong", "incorrect", "redo") || v === "no";
}

function isLoadPicks(input = "") {
  const v = normalize(input);
  // Accept if input contains a "load/love/lav/lod" sound AND a "pick/pic" sound
  const hasLoadSound = has(v, "load", "lov", "lod", "lav", "lok", "lot pick", "lob", "lof", "lop");
  const hasPickSound = has(v, "pick", "pic ", "pik", " pic", "pec", "pek", "peak", "peek");
  if (hasLoadSound && hasPickSound) return true;
  // Accept Spanish variants
  if (has(v, "cargar", "selec", "carga")) return true;
  // Accept if the phrase is "load picks" like with any accent (broad fallback)
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
  autoAdvance?: boolean;
  autoAdvanceDelayMs?: number;
}

export function createNovaTrainerSession({
  selector,
  assignments,
  assignmentStops,
}: {
  selector: Selector;
  assignments: ServerAssignment[];
  assignmentStops: Record<string, ServerStop[]>;
}) {
  const myAssignments = assignments.filter(
    (a) => !a.archived && a.selectorUserId === selector.userId
  );

  const state = {
    selector,
    phase: PHASES.WAIT_WAKE as Phase,
    prompt: 'Say "Hey NOVA" to begin.',
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
    };
  }

  function startAssignedBatch(): TrainerSnapshot {
    const assignment = myAssignments[0];
    if (!assignment) {
      return setPrompt("No assignment assigned to your username.");
    }
    state.activeAssignmentId = assignment.id;
    state.currentStopIndex = 0;
    state.phase = PHASES.LOAD_SUMMARY;
    return setPrompt(
      `Start aisle ${assignment.startAisle} end aisle ${assignment.endAisle}. ` +
        `Total cases ${assignment.totalCases}. Pallets ${assignment.pallets}. ` +
        `Estimated goal ${assignment.goalTimeMinutes} minutes. ` +
        `To continue say ready.`
    );
  }

  function moveToNextStop(): TrainerSnapshot {
    const stops = currentStops();
    if (state.currentStopIndex < stops.length - 1) {
      state.currentStopIndex += 1;
      state.phase = PHASES.PICK_CHECK;
      const stop = currentStop()!;
      return setPrompt(`New aisle ${stop.aisle} slot ${stop.slot}`);
    }
    state.phase = PHASES.COMPLETE_DOOR;
    const assignment = currentAssignment();
    return setPrompt(
      `Batch complete deliver pallet bravo to door ${assignment?.doorNumber ?? ""}`
    );
  }

  function handleWorkflowInput(rawInput = ""): TrainerSnapshot {
    // Internal auto-advance signal — skip to next stop without waiting for "ready"
    if (rawInput === "__AUTO_NEXT__" && state.phase === PHASES.PICK_READY) {
      return moveToNextStop();
    }

    const input = normalize(rawInput);
    log("USER", rawInput || input);

    if (isStop(input)) {
      state.phase = PHASES.STOPPED;
      return setPrompt('NOVA stopped. Say "Hey NOVA" to wake me again.');
    }

    if (state.phase === PHASES.WAIT_WAKE || state.phase === PHASES.STOPPED) {
      if (isWake(input)) {
        state.phase = PHASES.SIGN_ON_EQUIPMENT;
        return setPrompt("Enter equipment ID.");
      }
      return snapshot();
    }

    if (state.phase === PHASES.SIGN_ON_EQUIPMENT) {
      const digits = digitsOnly(input);
      if (!digits) return setPrompt("Enter equipment ID.");
      state.equipmentId = digits;
      state.phase = PHASES.CONFIRM_EQUIPMENT;
      return setPrompt(`Confirm equipment ${digits}.`);
    }

    if (state.phase === PHASES.CONFIRM_EQUIPMENT) {
      if (isConfirm(input)) {
        state.phase = PHASES.MAX_PALLET_COUNT;
        return setPrompt(
          `Enter maximum pallet count for jack ${state.equipmentId}.`
        );
      }
      if (isDeny(input)) {
        state.equipmentId = "";
        state.phase = PHASES.SIGN_ON_EQUIPMENT;
        return setPrompt("Enter equipment ID.");
      }
      return setPrompt(`Confirm equipment ${state.equipmentId}.`);
    }

    if (state.phase === PHASES.MAX_PALLET_COUNT) {
      const digits = digitsOnly(input);
      if (!digits) return setPrompt("Enter maximum pallet count.");
      state.maxPalletCount = digits;
      state.phase = PHASES.CONFIRM_MAX_PALLET_COUNT;
      return setPrompt("Confirm maximum pallet count.");
    }

    if (state.phase === PHASES.CONFIRM_MAX_PALLET_COUNT) {
      if (isConfirm(input)) {
        state.phase = PHASES.SAFETY;
        state.safetyIndex = 0;
        return setPrompt(SAFETY_ITEMS[0]);
      }
      if (isDeny(input)) {
        state.phase = PHASES.MAX_PALLET_COUNT;
        return setPrompt(
          `Enter maximum pallet count for jack ${state.equipmentId}.`
        );
      }
      return setPrompt("Confirm maximum pallet count.");
    }

    if (state.phase === PHASES.SAFETY) {
      const item = SAFETY_ITEMS[state.safetyIndex];
      if (isConfirm(input)) {
        if (state.safetyIndex < SAFETY_ITEMS.length - 1) {
          state.safetyIndex += 1;
          return setPrompt(SAFETY_ITEMS[state.safetyIndex]);
        }
        state.phase = PHASES.WAIT_LOAD_PICKS;
        return setPrompt("Say load picks.");
      }
      if (isDeny(input)) {
        state.failedSafetyItem = item;
        state.phase = PHASES.STOPPED;
        return setPrompt(`Safety failed. ${item} Session stopped.`);
      }
      return setPrompt(item);
    }

    if (state.phase === PHASES.WAIT_LOAD_PICKS) {
      if (isLoadPicks(input)) return startAssignedBatch();
      return setPrompt("Say load picks.");
    }

    if (state.phase === PHASES.LOAD_SUMMARY) {
      if (isReady(input)) {
        state.phase = PHASES.SETUP_ALPHA;
        return setPrompt("Position alpha pallet get chep.");
      }
      return setPrompt("To continue say ready.");
    }

    if (state.phase === PHASES.SETUP_ALPHA) {
      if (isReady(input)) {
        state.phase = PHASES.SETUP_BRAVO;
        return setPrompt("Position bravo pallet get chep.");
      }
      return setPrompt("Position alpha pallet get chep.");
    }

    if (state.phase === PHASES.SETUP_BRAVO) {
      if (isReady(input)) {
        state.phase = PHASES.PICK_CHECK;
        const stop = currentStop();
        if (!stop) return setPrompt("No stops found.");
        return setPrompt(`New aisle ${stop.aisle} slot ${stop.slot}`);
      }
      return setPrompt("Position bravo pallet get chep.");
    }

    if (state.phase === PHASES.PICK_CHECK) {
      const stop = currentStop();
      if (!stop) return snapshot();
      const digits = digitsOnly(input);
      if (!digits) {
        state.invalidCount += 1;
        return setPrompt(`You said ${input || "nothing"}. Invalid.`);
      }
      if (digits !== stop.checkCode) {
        state.invalidCount += 1;
        return setPrompt(`You said ${digits}. Invalid.`);
      }
      // Correct check code — speak grab prompt then auto-advance to next slot
      state.phase = PHASES.PICK_READY;
      const side = state.currentStopIndex % 2 === 0 ? "Alpha" : "Bravo";
      const prompt = `Grab ${stop.qty} ${side}`;
      state.prompt = prompt;
      log("NOVA", prompt);
      return { ...snapshot(), autoAdvance: true, autoAdvanceDelayMs: 900 };
    }

    if (state.phase === PHASES.PICK_READY) {
      // Fallback: selector manually says "ready" (e.g. if auto-advance signal was lost)
      if (isReady(input) || isConfirm(input)) {
        return moveToNextStop();
      }
      return snapshot();
    }

    if (state.phase === PHASES.COMPLETE_DOOR) {
      const assignment = currentAssignment();
      if (digitsOnly(input) === String(assignment?.doorCode ?? "")) {
        state.phase = PHASES.COMPLETE_ALPHA;
        return setPrompt("Apply labels to pallet alpha");
      }
      return setPrompt(
        `Batch complete deliver pallet bravo to door ${assignment?.doorNumber ?? ""}`
      );
    }

    if (state.phase === PHASES.COMPLETE_ALPHA) {
      const digits = digitsOnly(input);
      if (
        input.includes("alpha") ||
        input.includes("alfa") ||
        digits === DEFAULTS.alphaLabelNumber
      ) {
        state.phase = PHASES.COMPLETE_BRAVO;
        return setPrompt("Apply labels to pallet bravo");
      }
      return setPrompt("Apply labels to pallet alpha");
    }

    if (state.phase === PHASES.COMPLETE_BRAVO) {
      const digits = digitsOnly(input);
      if (input.includes("bravo") || digits === DEFAULTS.bravoLabelNumber) {
        state.phase = PHASES.COMPLETE_STAGE_BRAVO;
        const assignment = currentAssignment();
        return setPrompt(
          `Deliver bravo pallet to door ${assignment?.doorNumber ?? ""}`
        );
      }
      return setPrompt("Apply labels to pallet bravo");
    }

    if (state.phase === PHASES.COMPLETE_STAGE_BRAVO) {
      const assignment = currentAssignment();
      if (digitsOnly(input) === String(assignment?.doorCode ?? "")) {
        state.phase = PHASES.COMPLETE_STAGE_ALPHA;
        return setPrompt(
          `Deliver alpha pallet to door ${assignment?.doorNumber ?? ""}`
        );
      }
      return setPrompt(
        `Deliver bravo pallet to door ${assignment?.doorNumber ?? ""}`
      );
    }

    if (state.phase === PHASES.COMPLETE_STAGE_ALPHA) {
      const assignment = currentAssignment();
      if (digitsOnly(input) === String(assignment?.doorCode ?? "")) {
        state.phase = PHASES.WAIT_LOAD_PICKS;
        return setPrompt("Say load picks.");
      }
      return setPrompt(
        `Deliver alpha pallet to door ${assignment?.doorNumber ?? ""}`
      );
    }

    return snapshot();
  }

  return { snapshot, handleWorkflowInput };
}

export type NovaTrainerSession = ReturnType<typeof createNovaTrainerSession>;
