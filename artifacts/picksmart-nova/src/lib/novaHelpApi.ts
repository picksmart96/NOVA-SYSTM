import { matchNovaHelpAnswer } from "@/lib/novaHelpMatcher";

export async function askNovaHelp(question: string): Promise<string> {
  try {
    const res = await fetch("/api/nova-help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as { answer?: string };
    if (data.answer) return data.answer;
    throw new Error("Empty response");
  } catch (err) {
    console.warn("NOVA Help AI unavailable, using local knowledge:", err);
    return matchNovaHelpAnswer(question);
  }
}
