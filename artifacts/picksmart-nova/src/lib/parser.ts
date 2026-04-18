export function normalizeSpeech(input = ""): string {
  return input.toLowerCase().trim();
}

/**
 * Strip filler words that riders add around commands:
 *  - leading/trailing "nova" (user addresses NOVA by name)
 *  - leading "hey" / "ok" / "okay" / "please"
 *  - trailing "please"
 */
function stripFillers(text: string): string {
  return text
    .replace(/^(hey\s+|ok\s+|okay\s+|please\s+|nova\s+)+/g, "")
    .replace(/(\s+nova|\s+please|\s+por\s+favor)$/g, "")
    .trim();
}

// ─── "load picks" phonetic variants ────────────────────────────────────────
// Covers every common STT mishearing across English, French/West-African,
// Spanish, and standard US accents.
//
// "load" heard as: load, lode, lod, lo, low, loud, laud, lope, road, node,
//                  note, loan, lot, log, lord, loathe, globe, global, code,
//                  goal, goad, told, bold, cold, gold, hold, mold, fold,
//                  local, locale, globe
// "picks" heard as: picks, pick, pix, pique, peaks, peak, peeks, peek,
//                   pics, pig, pigs, big, mix, fix, pit, pits, bix, six,
//                   peck, pecks, bit, bits
// ───────────────────────────────────────────────────────────────────────────
const LOAD_PICKS_VARIANTS: string[] = [
  // ── Canonical ──
  "load picks", "load pick",
  // ── lode / lod ──
  "lode picks", "lode pick", "lode pix", "lode peaks", "lode peak",
  "lod picks", "lod pick", "lod pix",
  // ── lo / low ──
  "lo picks", "lo pick", "lo pix", "lo peaks", "lo peak",
  "low picks", "low pick", "low pix", "low peaks", "low peak",
  // ── loaded ──
  "loaded picks", "loaded pick", "loaded peaks",
  // ── load up / load my ──
  "load up picks", "load up pick", "load my picks", "load my pick",
  // ── loud / laud ──
  "loud picks", "loud pick", "loud peaks",
  "laud picks", "laud pick", "laud pix",
  // ── lope ──
  "lope picks", "lope pick", "lope pix",
  // ── road (r/l swap — French, Japanese, Korean accents) ──
  "road picks", "road pick", "road pix", "road peaks", "road peak",
  // ── node / note / nod / no pick ──
  "node picks", "node pick",
  "note picks", "note pick",
  "nod picks", "nod pick",
  // ── loan / log / lot / lord ──
  "loan pick", "loan picks",
  "log pick", "log picks",
  "lot pick", "lot picks",
  "lord pick", "lord picks",
  // ── code / cold / gold / bold ──
  "code pick", "code picks",
  "cold pick", "cold picks",
  "gold pick", "gold picks",
  "bold pick", "bold picks",
  // ── go pick (already in command list) ──
  "go picks", "go pick",
  // ── "picks" → peaks / pique / pix / pics ──
  "load peaks", "load peak",
  "load pique", "load pix", "load pics",
  "load peeks", "load peek",
  "load big", "load bix",
  "load fix", "load mix",
  "load six", // unlikely but possible
  "load peck", "load pecks",
  // ── "local" ──
  "local pick", "local picks",
  // ── Spanish variants ──
  "cargar picks", "cargar pick", "cargar pix", "cargar",
  "carga picks", "carga pick",
  "mis picks", "mis piks",
  // ── "start picks" / "start pick" (intent phrase) ──
  "start picks", "start pick",
  "begin picks", "begin pick",
  "open picks", "open pick",
];

export function isLoadPicks(input = ""): boolean {
  const raw = normalizeSpeech(input)
    .replace(/[^\w\s]/g, "")   // strip punctuation
    .replace(/\s+/g, " ");
  const t = stripFillers(raw);
  // Check cleaned text AND original (in case stripping was too aggressive)
  return (
    LOAD_PICKS_VARIANTS.some((v) => t.includes(v)) ||
    LOAD_PICKS_VARIANTS.some((v) => raw.includes(v))
  );
}

export function isConfirm(input = ""): boolean {
  const value = normalizeSpeech(input);
  return ["yes", "confirm", "affirmative"].includes(value);
}

export function isDeny(input = ""): boolean {
  const value = normalizeSpeech(input);
  return ["no", "cancel", "negative"].includes(value);
}

export function isReady(input = ""): boolean {
  const t = normalizeSpeech(input)
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
  const cleaned = stripFillers(t);
  return (
    cleaned === "ready" ||
    t === "ready" ||
    ["listo", "lista", "listos"].includes(cleaned) ||
    ["listo", "lista", "listos"].includes(t)
  );
}

export function extractDigits(input = ""): string {
  return normalizeSpeech(input).replace(/[^0-9]/g, "");
}

export function extractNumber(input = ""): string {
  const spoken = normalizeSpeech(input)
    .replace(/\bone\b/g, "1").replace(/\btwo\b/g, "2").replace(/\bthree\b/g, "3")
    .replace(/\bfour\b/g, "4").replace(/\bfive\b/g, "5").replace(/\bsix\b/g, "6")
    .replace(/\bseven\b/g, "7").replace(/\beight\b/g, "8").replace(/\bnine\b/g, "9")
    .replace(/\bzero\b/g, "0");
  return spoken.replace(/[^0-9]/g, "");
}
