export function normalizeText(input = "") {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

export function levenshtein(a = "", b = "") {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

// Returns true when `phrase` appears inside `text` at word boundaries in at
// least one location (preceded by start-of-string or a space; followed by
// end-of-string or a space). All occurrences are scanned so that an embedded
// hit earlier in the string does not hide a valid standalone hit later.
// Example: "incorrecto correcto" — the first hit of "correcto" is embedded
// (preceded by 'o'), but the second is standalone; returns true.
function containsAsWords(text: string, phrase: string): boolean {
  let start = 0;
  while (true) {
    const idx = text.indexOf(phrase, start);
    if (idx === -1) return false;
    const before = idx === 0 ? " " : text[idx - 1];
    const after = idx + phrase.length === text.length ? " " : text[idx + phrase.length];
    if (before === " " && after === " ") return true;
    start = idx + 1;
  }
}

export function closeEnough(input: string, target: string, maxDistance = 2) {
  const a = normalizeText(input);
  const b = normalizeText(target);

  if (!a || !b) return false;
  if (a === b) return true;

  // Short single-word targets use a tighter distance cap to prevent fuzzy
  // collisions across unrelated commands as more language variants are added.
  //
  // Audit of all single-word phrases ≤ 5 chars (April 2026):
  //   confirm : "yes"(3) "si"(2)
  //   deny    : "no"(2) "nope"(4)
  //   ready   : "ready"(5) "redy"(4) "reddy"(5) "listo"(5) "lista"(5)
  //   load_picks: "carga"(5) "lo"(2) "low"(3) "mis"(3)
  //   stop    : "stop"(4) "parar"(5)
  //   resume  : "vamos"(5)
  //   repeat  : "again"(5)
  //
  // Cross-command collisions at distance ≤ 2:
  //   "si"(confirm) ↔ "no"(deny), "lo"(load_picks), "mis"(load_picks) — all
  //     safe because ≤ 2-char rule already enforces exact-only for "si"/"no"/"lo".
  //   "yes"(confirm) ↔ "mis"(load_picks)  → distance 2 — REAL COLLISION RISK
  //     e.g. a fuzzy input "mes" would match confirm:yes (d=2) before
  //     load_picks:mis (d=1) because confirm appears first in the list.
  //
  // Rule: single-word targets of ≤ 2 chars  → must be exact (effectiveMax = 0)
  //        single-word targets of 3–5 chars → cap at distance 1 (effectiveMax ≤ 1)
  //        multi-word phrases or longer words → use caller-supplied maxDistance
  const isSingleWord = !b.includes(" ");
  let effectiveMax: number;
  if (b.length <= 2) {
    effectiveMax = 0;
  } else if (isSingleWord && b.length <= 5) {
    effectiveMax = Math.min(maxDistance, 1);
  } else {
    effectiveMax = maxDistance;
  }

  if (effectiveMax > 0 && (containsAsWords(a, b) || containsAsWords(b, a))) return true;
  // Only allow Levenshtein to match when the strings are close in length
  // (≤ 1 char apart). A length difference of 2+ means one word is a
  // prefix/suffix extension of the other (e.g. "in" + "correcto") which
  // should not count as a fuzzy spelling variant.
  if (Math.abs(a.length - b.length) > 1) return false;
  return levenshtein(a, b) <= effectiveMax;
}

export function matchCommand(input = "") {
  const text = normalizeText(input);

  const commands = [
    {
      key: "confirm",
      phrases: [
        "confirm", "yes", "affirmative", "comfirm", "confarm", "consirm",
        // Spanish
        "si", "sí", "correcto", "confirmado", "afirmativo",
      ],
    },
    {
      key: "deny",
      phrases: [
        "no", "negative", "cancel", "nope",
        // Spanish
        "negativo", "incorrecto", "cancelar",
      ],
    },
    {
      key: "ready",
      phrases: [
        "ready", "redy", "reddy",
        // Spanish
        "listo", "lista", "listos",
      ],
    },
    {
      // "load picks" — comprehensive accent-tolerant variants
      // Covers French/West-African, Spanish, US, and standard accent mishearings
      key: "load_picks",
      phrases: [
        // ── canonical ──
        "load picks", "load pick",
        // ── lode / lod ──
        "lode picks", "lode pick", "lode pix", "lode peaks", "lode peak",
        "lod picks", "lod pick",
        // ── lo / low ──
        "lo picks", "lo pick", "lo pix",
        "low picks", "low pick", "low pix",
        // ── loaded / load up / load my ──
        "loaded picks", "loaded pick",
        "load up picks", "load up pick",
        "load my picks", "load my pick",
        // ── loud / laud / lope ──
        "loud picks", "loud pick",
        "laud picks", "laud pick",
        "lope picks", "lope pick",
        // ── road (r/l swap) ──
        "road picks", "road pick", "road pix",
        // ── note / node / nod ──
        "note picks", "note pick",
        "node picks", "node pick",
        "nod picks", "nod pick",
        // ── loan / log / lot / lord ──
        "loan pick", "loan picks",
        "log pick", "log picks",
        "lot pick", "lot picks",
        // ── go pick ──
        "go picks", "go pick",
        // ── "picks" heard as peaks / pique / pix / pics / big / mix ──
        "load peaks", "load peak",
        "load pique", "load pix", "load pics",
        "load peeks", "load peek",
        "load big", "load fix", "load mix",
        // ── start / begin / open intent ──
        "start picks", "start pick",
        "begin picks", "begin pick",
        "open picks", "open pick",
        // ── Spanish ──
        "cargar picks", "cargar pick", "cargar pix", "cargar",
        "carga picks", "carga pick",
        "mis picks", "mis piks",
      ],
    },
    {
      key: "stop",
      phrases: [
        "stop", "nova stop", "stop listening", "nova stop listening",
        // Spanish
        "parar", "detener", "terminar", "para nova",
      ],
    },
    {
      // Resume from paused/stopped state
      key: "resume",
      phrases: [
        "resume", "nova resume",
        "ready to go", "nova ready to go",
        "nova ready", "let's go", "lets go", "continue",
        // Spanish
        "reanudar", "continuar", "vamos",
      ],
    },
    {
      key: "wake",
      phrases: [
        "hey nova", "hola nova",
      ],
    },
    {
      key: "repeat",
      phrases: [
        "nova repeat", "repeat", "say again", "say it again", "again",
        // Spanish
        "repetir", "repite", "otra vez",
      ],
    },
  ];

  // First pass: exact single-word phrase matches only — explicit single-word
  // phrases always win over fuzzy matches from other commands. This prevents
  // e.g. "parar" (stop) from being swallowed by a fuzzy hit on "cargar"
  // (load_picks) just because levenshtein("parar","cargar") === 2.
  // Multi-word phrases are intentionally excluded so that substring matching
  // in the fuzzy pass can still override them (e.g. "ready to go" → "ready").
  for (const command of commands) {
    for (const phrase of command.phrases) {
      const normalized = normalizeText(phrase);
      if (!normalized.includes(" ") && normalized === text) {
        return command.key;
      }
    }
  }

  // Second pass: fuzzy / substring matches
  for (const command of commands) {
    for (const phrase of command.phrases) {
      if (closeEnough(text, phrase)) {
        return command.key;
      }
    }
  }

  return null;
}
