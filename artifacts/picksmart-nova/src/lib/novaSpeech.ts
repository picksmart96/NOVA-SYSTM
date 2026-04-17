/**
 * NOVA bilingual speech library
 * All NOVA voice text in English and Spanish.
 * Picks the right voice from browser speech synthesis.
 */

// ── Voice picker ──────────────────────────────────────────────────────────────

export function pickNovaVoice(lang: string): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const isSpanish = lang.startsWith("es");

  if (isSpanish) {
    return (
      voices.find((v) => /paulina|monica|diego|juan|jorge|ximena/i.test(v.name) && v.lang.startsWith("es")) ||
      voices.find((v) => /google español|google es/i.test(v.name + v.lang)) ||
      voices.find((v) => v.lang.startsWith("es-US") && v.default) ||
      voices.find((v) => v.lang.startsWith("es-MX") && v.default) ||
      voices.find((v) => v.lang.startsWith("es") && v.default) ||
      voices.find((v) => v.lang.startsWith("es")) ||
      voices[0]
    );
  }
  return (
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name) && v.lang.startsWith("en")) ||
    voices.find((v) => /samantha|aria|ava|zira|karen/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en") && v.default) ||
    voices[0]
  );
}

// ── Core speak function ───────────────────────────────────────────────────────
// Chrome-hardened: fixes cancel→speak race, 15-second cutoff, and paused state.
//
// KEY DESIGN: Only call cancel() when something is already playing.
// Calling cancel() then setTimeout(speak, 120) can lose Chrome's user-gesture
// context, causing silent speech failures. When idle, speak immediately.

export function novaSpeak(
  text: string,
  lang: string,
  onDone?: () => void,
  opts?: { rate?: number; pitch?: number; onStart?: () => void }
): void {
  if (!("speechSynthesis" in window)) { onDone?.(); return; }

  const doSpeak = () => {
    // Resume in case the synthesizer is in a paused state (Chrome quirk)
    window.speechSynthesis.resume();

    const u = new SpeechSynthesisUtterance(text);
    u.lang  = lang.startsWith("es") ? "es-US" : "en-US";
    u.rate  = opts?.rate  ?? 1.25;
    u.pitch = opts?.pitch ?? 1;

    const applyVoice = () => {
      const voice = pickNovaVoice(lang);
      if (voice) u.voice = voice;
    };
    applyVoice();

    // Chrome bug: speech silently stops after ~15 seconds for long texts.
    // Workaround: pause/resume every 14 s to reset the internal timer.
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 14000);

    u.onstart = () => { opts?.onStart?.(); };
    u.onend   = () => { clearInterval(keepAlive); onDone?.(); };
    u.onerror = () => { clearInterval(keepAlive); onDone?.(); };

    if (window.speechSynthesis.getVoices().length === 0) {
      // Voices not loaded yet — wait for them
      const onVoices = () => {
        applyVoice();
        window.speechSynthesis.speak(u);
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    } else {
      window.speechSynthesis.speak(u);
    }
  };

  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    // Something is playing — cancel it, then wait for the flush before speaking.
    // The 150 ms gap gives Chrome's cancel() time to fully flush.
    window.speechSynthesis.cancel();
    setTimeout(doSpeak, 150);
  } else {
    // Synthesizer is idle — speak immediately to preserve the user-gesture context.
    doSpeak();
  }
}

// ── Recognition language ──────────────────────────────────────────────────────

export function novaRecogLang(lang: string): string {
  return lang.startsWith("es") ? "es-US" : "en-US";
}

// ── Bilingual strings ─────────────────────────────────────────────────────────

export const NOVA_TEXT = {

  // ── Selector Portal ────────────────────────────────────────────────────────

  greeting(name: string, hour: number, lang: string): string {
    const isES = lang.startsWith("es");
    const greet = hour < 12
      ? (isES ? "Buenos días" : "Good morning")
      : hour < 17
        ? (isES ? "Buenas tardes" : "Good afternoon")
        : (isES ? "Buenas noches" : "Good evening");
    return isES
      ? `${greet}, ${name}. Soy NOVA. Toca "Pregunta a NOVA" para escuchar tu tarea o el resumen de hoy.`
      : `${greet}, ${name}. I'm NOVA. Tap "Ask NOVA" to hear your assignment or today's briefing.`;
  },

  todayFocusHeader(lang: string): string {
    return lang.startsWith("es") ? "Enfoque de hoy. " : "Today's focus. ";
  },

  assignmentLine(a: {
    assignmentNumber: number;
    startAisle: number;
    endAisle: number;
    totalCases: number;
    stops: number;
    goalTimeMinutes: number;
    doorNumber: number;
  }, lang: string): string {
    return lang.startsWith("es")
      ? `Tu tarea es el número ${a.assignmentNumber}. Pasillos del ${a.startAisle} al ${a.endAisle}. ${a.totalCases} cajas, ${a.stops} paradas. Tiempo meta: ${a.goalTimeMinutes} minutos. Etapa en la puerta ${a.doorNumber}. `
      : `Your assignment is number ${a.assignmentNumber}. Aisles ${a.startAisle} through ${a.endAisle}. ${a.totalCases} cases, ${a.stops} stops. Goal time: ${a.goalTimeMinutes} minutes. Stage at Door ${a.doorNumber}. `;
  },

  safetyPrefix(lang: string): string {
    return lang.startsWith("es") ? "Seguridad: " : "Safety: ";
  },

  workloadPrefix(lang: string): string {
    return lang.startsWith("es") ? "Carga de trabajo: " : "Workload: ";
  },

  noFocusAvailable(lang: string): string {
    return lang.startsWith("es")
      ? "No hay tarea ni resumen disponible en este momento. Consulta con tu supervisor."
      : "No assignment or briefing available right now. Check with your supervisor.";
  },

  latestUpdateHeader(lang: string): string {
    return lang.startsWith("es") ? "Última actualización del supervisor. " : "Latest supervisor update. ";
  },

  shiftPrefix(lang: string): string {
    return lang.startsWith("es") ? "Turno: " : "Shift: ";
  },

  topSelectorLine(name: string, rate: string, lang: string): string {
    return lang.startsWith("es")
      ? `Mejor selector: ${name} con ${rate}. `
      : `Top selector: ${name} at ${rate}. `;
  },

  noUpdateYet(lang: string): string {
    return lang.startsWith("es")
      ? "No hay actualización del supervisor todavía. Regresa al inicio de tu turno."
      : "No supervisor update posted yet. Check back at the start of your shift.";
  },

  fullAssignment(a: {
    assignmentNumber: number;
    startAisle: number;
    endAisle: number;
    totalCases: number;
    stops: number;
    goalTimeMinutes: number;
    doorNumber: number;
    doorCode?: string;
  }, lang: string): string {
    return lang.startsWith("es")
      ? `Tu tarea es el número ${a.assignmentNumber}. Pasillos del ${a.startAisle} al ${a.endAisle}. ${a.totalCases} cajas. ${a.stops} paradas. Meta: ${a.goalTimeMinutes} minutos. Etapa en puerta ${a.doorNumber}${a.doorCode ? `, código ${a.doorCode}` : ""}.`
      : `Your assignment is number ${a.assignmentNumber}. Aisles ${a.startAisle} through ${a.endAisle}. ${a.totalCases} cases. ${a.stops} stops. Goal: ${a.goalTimeMinutes} minutes. Stage at Door ${a.doorNumber}${a.doorCode ? `, code ${a.doorCode}` : ""}.`;
  },

  noAssignmentYet(lang: string): string {
    return lang.startsWith("es")
      ? "Todavía no tienes una tarea. Consulta con tu supervisor o entrenador."
      : "You don't have an assignment yet. Ask your supervisor or trainer.";
  },

  heardCommand(lang: string): string {
    return lang.startsWith("es") ? "Escuché: " : "Heard: ";
  },

  unknownCommand(lang: string): string {
    return lang.startsWith("es")
      ? "No entendí el comando. Di: enfoque de hoy, tarea, o última actualización."
      : "I didn't catch a command. Try saying: today's focus, assignment, or latest update.";
  },

  listeningStatus(lang: string): string {
    return lang.startsWith("es") ? "Escuchando…" : "Listening…";
  },

  cantHear(lang: string): string {
    return lang.startsWith("es") ? "No pude escuchar. Intenta de nuevo." : "Couldn't hear that. Try again.";
  },

  speakingFocus(lang: string): string {
    return lang.startsWith("es") ? "Leyendo el enfoque de hoy…" : "Speaking today's focus…";
  },

  speakingUpdate(lang: string): string {
    return lang.startsWith("es") ? "Leyendo la última actualización…" : "Speaking latest update…";
  },

  speakingAssignment(lang: string): string {
    return lang.startsWith("es") ? "Leyendo tu tarea…" : "Speaking assignment…";
  },

  noVoiceSupport(lang: string): string {
    return lang.startsWith("es")
      ? "Los comandos de voz no son compatibles con este navegador."
      : "Voice commands are not supported in this browser.";
  },

  // ── Lesson coaching ────────────────────────────────────────────────────────

  lessonIntro: {
    beginner(lang: string): string {
      return lang.startsWith("es")
        ? "Bienvenido al módulo de introducción. Aprenderás los fundamentos de la selección de almacén."
        : "Welcome to the beginner module. You'll learn the fundamentals of warehouse picking.";
    },
    safety(lang: string): string {
      return lang.startsWith("es")
        ? "Este módulo cubre seguridad en el almacén. La seguridad siempre es lo primero."
        : "This module covers warehouse safety. Safety is always first.";
    },
    palletBuilding(lang: string): string {
      return lang.startsWith("es")
        ? "Aprende cómo construir tarimas correctamente para evitar daños y accidentes."
        : "Learn how to build pallets correctly to prevent damage and accidents.";
    },
    pickPath(lang: string): string {
      return lang.startsWith("es")
        ? "Optimiza tu ruta de selección para ahorrar tiempo y aumentar tu rendimiento."
        : "Optimize your pick path to save time and increase your performance.";
    },
    pace(lang: string): string {
      return lang.startsWith("es")
        ? "El ritmo correcto es clave. Rápido pero seguro, consistente todo el turno."
        : "The right pace is key. Fast but safe, consistent all shift.";
    },
    realShift(lang: string): string {
      return lang.startsWith("es")
        ? "Simulación de turno real. Aplica todo lo que aprendiste en un escenario completo."
        : "Real shift simulation. Apply everything you learned in a full scenario.";
    },
  },

  lessonComplete(lang: string): string {
    return lang.startsWith("es")
      ? "¡Excelente trabajo! Lección completada."
      : "Excellent work! Lesson complete.";
  },

  lessonTip(tip: string, lang: string): string {
    return lang.startsWith("es") ? `Consejo: ${tip}` : `Tip: ${tip}`;
  },

  // ── Supervisor briefing ────────────────────────────────────────────────────

  supervisorGreeting(lang: string): string {
    return lang.startsWith("es")
      ? "Resumen del supervisor. Aquí está la actualización del turno."
      : "Supervisor briefing. Here is the shift update.";
  },

  // ── NOVA Trainer prompts ───────────────────────────────────────────────────

  trainerReady(lang: string): string {
    return lang.startsWith("es")
      ? "NOVA lista. Esperando tu código de verificación."
      : "NOVA ready. Waiting for your check code.";
  },

  trainerCorrect(lang: string): string {
    return lang.startsWith("es") ? "Correcto. Siguiente parada." : "Correct. Next stop.";
  },

  trainerWrong(lang: string): string {
    return lang.startsWith("es") ? "Código incorrecto. Intenta de nuevo." : "Wrong code. Try again.";
  },

  trainerDone(lang: string): string {
    return lang.startsWith("es")
      ? "¡Tarea completada! Excelente trabajo."
      : "Assignment complete! Excellent work.";
  },
};

// ── Voice command keywords bilingual ──────────────────────────────────────────

export const NOVA_COMMANDS = {
  focus:      { en: ["today", "focus", "briefing"], es: ["hoy", "enfoque", "resumen"] },
  update:     { en: ["supervisor", "update", "latest"], es: ["supervisor", "actualización", "última"] },
  assignment: { en: ["assignment", "door", "aisle", "task"], es: ["tarea", "puerta", "pasillo", "asignación"] },
};

export function matchNovaCommand(
  text: string,
  lang: string
): "focus" | "update" | "assignment" | null {
  const t = text.toLowerCase();
  const isES = lang.startsWith("es");
  const key = isES ? "es" : "en";

  if (NOVA_COMMANDS.focus[key].some((w) => t.includes(w)))      return "focus";
  if (NOVA_COMMANDS.update[key].some((w) => t.includes(w)))     return "update";
  if (NOVA_COMMANDS.assignment[key].some((w) => t.includes(w))) return "assignment";

  // Always try English fallback too (bilingual speakers)
  if (NOVA_COMMANDS.focus.en.some((w) => t.includes(w)))      return "focus";
  if (NOVA_COMMANDS.update.en.some((w) => t.includes(w)))     return "update";
  if (NOVA_COMMANDS.assignment.en.some((w) => t.includes(w))) return "assignment";

  return null;
}
