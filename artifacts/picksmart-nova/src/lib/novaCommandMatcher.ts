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

  return levenshtein(a, b) <= maxDistance;
}

export function matchCommand(input = "") {
  const text = normalizeText(input);

  const commands = [
    { key: "confirm", phrases: ["confirm", "yes", "affirmative", "comfirm", "confarm", "consirm"] },
    { key: "deny",    phrases: ["no", "negative", "cancel"] },
    { key: "ready",   phrases: ["ready"] },
    { key: "load_picks", phrases: ["load picks", "load pick"] },
    { key: "stop",    phrases: ["stop"] },
    { key: "wake",    phrases: ["hey nova"] },
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
