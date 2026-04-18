/**
 * NOVA Mode Router
 * Classifies user voice/text input as either a structured WORKFLOW command
 * or a free-form HELP question to send to the AI brain.
 */

// ─── Helpers ───────────────────────────────────────────────────────────────

function stripFillers(text: string): string {
  return text
    .replace(/^(hey\s+|ok\s+|okay\s+|please\s+|nova\s+)+/gi, "")
    .replace(/(\s+nova|\s+please|\s+por\s+favor)$/gi, "")
    .trim();
}

// ─── Load Picks — all accent/STT variants ─────────────────────────────────
// Any phrase that means "start loading picks" gets routed to workflow.
const LOAD_PICKS_FRAGMENTS = [
  "load pick", "lode pick", "lod pick", "lo pick", "low pick",
  "loaded pick", "load up pick", "load my pick",
  "loud pick", "laud pick", "lope pick",
  "road pick", "note pick", "node pick", "nod pick",
  "loan pick", "log pick", "lot pick", "lord pick",
  "go pick",
  "load peak", "load pique", "load pix", "load pic",
  "load peek", "load big", "load fix", "load mix",
  "start pick", "begin pick", "open pick",
  "cargar pick", "cargar pix", "cargar",
  "carga pick", "mis pick", "mis pik",
];

function isLoadPicksInput(text: string): boolean {
  return LOAD_PICKS_FRAGMENTS.some((f) => text.includes(f));
}

// ─── Exact workflow command tokens ────────────────────────────────────────
const WORKFLOW_EXACT = new Set([
  "load picks", "load pick", "cargar picks",
  "ready", "listo",
  "yes", "si", "sí", "correct", "correcto", "confirm", "confirmar",
  "no", "deny",
  "slot empty", "espacio vacío",
  "report damage", "reportar daño",
  "skip slot", "saltar espacio",
  "close batch", "cerrar batch",
  "repeat labels", "repetir etiquetas",
  "remove pallet", "quitar tarima",
  "no labels", "sin etiquetas",
  "recap weights", "resumir pesos",
  "base items", "artículos base",
  "base complete", "base completa",
  "exit list", "salir de lista",
  "next", "siguiente",
  "previous", "anterior",
  "makeup skips", "maquillaje",
  "get drops", "obtener drops",
  "bravo", "alpha", "alfa",
  "stop", "parar",
  "grab", "agarrar",
]);

// Pattern-based workflow matchers
const WORKFLOW_PATTERNS: RegExp[] = [
  /^go to aisle\s+\d+$/,
  /^ir al pasillo\s+\d+$/,
  /^damage\s+\d+$/,
  /^daño\s+\d+$/,
  /^\d{3,6}$/,
  /^nova[-\s]?\d{4,6}$/i,
];

// Words that indicate a question → help mode
const HELP_INDICATORS = [
  "how", "why", "what", "when", "where", "who",
  "cómo", "por qué", "qué", "cuándo", "dónde",
  "explain", "tell me", "help me", "help with",
  "i need", "i don't", "no entiendo", "necesito ayuda",
];

export type NovaInputMode = "workflow" | "help";

/**
 * Route a normalized voice input to either workflow mode or help mode.
 */
export function routeNovaInput(rawInput: string): NovaInputMode {
  const raw = rawInput.toLowerCase().trim().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
  const norm = stripFillers(raw);

  if (!norm && !raw) return "workflow";

  // Check both stripped and original forms
  if (WORKFLOW_EXACT.has(norm) || WORKFLOW_EXACT.has(raw)) return "workflow";

  // Load picks accent-tolerant check on both forms
  if (isLoadPicksInput(norm) || isLoadPicksInput(raw)) return "workflow";

  // Pattern match
  if (WORKFLOW_PATTERNS.some((r) => r.test(norm) || r.test(raw))) return "workflow";

  // Contains a help indicator word → help mode
  if (HELP_INDICATORS.some((w) => norm.includes(w))) return "help";

  // Default: if it reads like a short command (≤4 words, no question structure), treat as workflow
  const wordCount = norm.split(/\s+/).length;
  if (wordCount <= 3) return "workflow";

  return "help";
}

/**
 * Detect wake words in a transcript.
 * Returns the wake language if found, null otherwise.
 */
export function detectWakeWord(transcript: string): "en" | "es" | null {
  const lower = transcript.toLowerCase();
  if (lower.includes("hey nova") || lower.includes("hey, nova")) return "en";
  if (lower.includes("hola nova") || lower.includes("hola, nova")) return "es";
  return null;
}

/**
 * Detect stop words in a transcript.
 */
export function detectStopWord(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim();
  return lower === "stop" || lower === "parar" || lower.startsWith("stop ") || lower.startsWith("parar ");
}
