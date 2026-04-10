import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getDemoSession, addDemoTurn, clearDemoSession } from "./novaDemoMemoryStore";

const router = Router();

function getPrompt(memorySummary: string, language: string): string {
  const isSpanish = language.startsWith("es");

  const langRule = isSpanish
    ? "Responde siempre en español."
    : "Always respond in English.";

  return `You are NOVA, a warm, intelligent, and professional public demo voice agent for PickSmart Academy.

${langRule}

You are separate from NOVA Help (the gated product AI) and NOVA Trainer (the voice-picking workflow).

Your purpose:
- Answer questions about PickSmart Academy
- Explain training, safety, pallet building, coaching, pace, onboarding, mentoring, and performance improvement
- Speak naturally like a real person — not a chatbot
- Help warehouse managers understand the value of the platform

You deeply understand selector struggles:
- Slow pace in early weeks, hesitation at the slot
- Bad stacking and pallet collapse
- Safety mistakes and near-misses
- Short picks, over picks, mispicks
- Low confidence, especially new hires
- Turnover from poor onboarding experience

You explain how PickSmart Academy + NOVA solves each problem with real training workflows.

${memorySummary ? `Recent conversation context:\n${memorySummary}` : ""}

Rules:
- Keep answers to 2–4 sentences — concise and conversational
- Sound like an experienced warehouse operations expert
- Never mention being an AI
- End each answer with a natural follow-up question
- When the user sounds interested in buying or getting access, say: "I can help you request company access whenever you're ready."
- Never reveal full locked lesson content or NOVA Trainer workflow details`;
}

router.post("/nova-demo-agent", async (req, res) => {
  const { message, sessionId, reset, language = "en" } = req.body as {
    message?: string;
    sessionId?: string;
    reset?: boolean;
    language?: string;
  };

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Missing sessionId." });
  }

  // Reset conversation
  if (reset) {
    clearDemoSession(sessionId);
    const isSpanish = language.startsWith("es");
    const reply = isSpanish
      ? "Conversación reiniciada. Hola, soy NOVA. Puedo responder cualquier pregunta sobre PickSmart Academy y cómo ayuda a los equipos de almacén."
      : "Conversation reset. Hi, I'm NOVA. I can answer any questions you have about PickSmart Academy and how it helps warehouse teams.";
    return res.json({ reply, handoff: false });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Missing message." });
  }

  addDemoTurn(sessionId, "user", message.trim());
  const session = getDemoSession(sessionId);

  const isSpanish = language.startsWith("es");
  const fallback = isSpanish
    ? "PickSmart Academy ayuda a entrenar selectores, mejorar seguridad y elevar el rendimiento. ¿Quieres que te explique más?"
    : "PickSmart Academy helps train selectors, improve safety, and raise performance. Would you like me to explain more?";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 280,
      messages: [
        { role: "system", content: getPrompt(session.summary, language) },
        { role: "user", content: message.trim() },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim() || fallback;
    addDemoTurn(sessionId, "assistant", reply);

    const lower = message.toLowerCase();
    const handoff =
      lower.includes("price") ||
      lower.includes("pricing") ||
      lower.includes("contract") ||
      lower.includes("subscribe") ||
      lower.includes("access") ||
      lower.includes("demo for my team") ||
      lower.includes("how do i start") ||
      lower.includes("company") ||
      lower.includes("buy") ||
      lower.includes("sign up") ||
      lower.includes("costo") ||
      lower.includes("precio") ||
      lower.includes("contrato");

    return res.json({ reply, handoff });
  } catch (err) {
    console.error("nova demo agent error:", err);
    return res.json({
      reply: fallback,
      handoff: false,
    });
  }
});

export default router;
