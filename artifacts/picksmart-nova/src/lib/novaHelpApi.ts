import { matchNovaHelpAnswer } from "@/lib/novaHelpMatcher";

export async function askNovaHelp(question: string, language = "en"): Promise<string> {
  try {
    const res = await fetch("/api/nova-help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, language }),
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

/**
 * Send a recorded audio blob to the Whisper API for transcription.
 * Returns the transcript string, or null on failure.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language = "en",
): Promise<string | null> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const res = await fetch(`/api/transcribe?lang=${language}`, {
      method: "POST",
      headers: { "Content-Type": "audio/webm" },
      body: buffer,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }

    const data = (await res.json()) as { transcript?: string };
    return data.transcript?.trim() || null;
  } catch (err) {
    console.error("transcribeAudio error:", err);
    return null;
  }
}
