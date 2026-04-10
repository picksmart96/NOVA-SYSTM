function normalizeText(input = "") {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function levenshtein(a = "", b = "") {
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

function closeEnough(input: string, target: string, maxDistance = 2) {
  const a = normalizeText(input);
  const b = normalizeText(target);

  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  // Short targets (≤ 2 chars) must be exact — a distance of 2 on "no" would
  // match digit words like "one", "oh", "ok", "dos", "un" causing false denies.
  const effectiveMax = b.length <= 2 ? 0 : maxDistance;
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
      // "load picks" — extended with phonetic variants from mobile STT mishearings
      key: "load_picks",
      phrases: [
        "load picks", "load pick",
        "lo picks", "lo pick",
        "loaded picks", "loaded pick",
        "load up picks", "load up pick",
        "load my picks", "load my pick",
        "lode picks", "lode pick",
        "go picks", "go pick",
        // Spanish
        "cargar picks", "cargar pix", "cargar", "carga picks",
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

  for (const command of commands) {
    for (const phrase of command.phrases) {
      if (closeEnough(text, phrase)) {
        return command.key;
      }
    }
  }

  return null;
}
