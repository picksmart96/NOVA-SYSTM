import { novaHelpKnowledge } from "@/data/novaHelpKnowledge";

export function matchNovaHelpAnswer(input = ""): string {
  const text = input.toLowerCase().trim();

  if (!text) {
    return "Ask me anything about selecting, pallet building, safety, or performance.";
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const item of novaHelpKnowledge) {
    let score = 0;
    for (const keyword of item.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.answer;
  }

  return "I focus on warehouse selecting, pallet building, safety, and performance. Ask me something in that area.";
}
