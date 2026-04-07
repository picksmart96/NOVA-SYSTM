export function normalizeSpeech(input = ""): string {
  return input.toLowerCase().trim();
}

export function isConfirm(input = ""): boolean {
  const value = normalizeSpeech(input);
  return ["yes", "confirm", "affirmative"].includes(value);
}

export function isDeny(input = ""): boolean {
  const value = normalizeSpeech(input);
  return ["no", "cancel", "negative"].includes(value);
}

export function isLoadPicks(input = ""): boolean {
  return normalizeSpeech(input) === "load picks";
}

export function isReady(input = ""): boolean {
  return normalizeSpeech(input) === "ready";
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
