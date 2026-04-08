import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  buildPalletAdviceFromAisles,
  extractAislesFromText,
  isBuildQuestion,
  TOWER_MAP,
} from "../lib/novaBuildCoach";

const router = Router();

// ─── System prompts ───────────────────────────────────────────────────────────
const NOVA_SYSTEM_PROMPT_EN = `You are NOVA Help, a warehouse order selector voice coach.

Your job:
- Answer ONLY about warehouse order selecting topics
- Focus on: pallet building, stacking, picking accuracy, mispick, short pick, over pick,
  slot check codes, pacing, rate improvement, safety, ergonomics, hydration,
  pallet jack handling, door staging, labels, batch complete, voice picking commands,
  beginner confidence, common mistakes, warehouse layout
- When asked about safety checks or equipment inspection, describe the 9-item checklist:
  Brakes, Battery guard, Horn, Wheels, Hydraulics, Controls, Steering, Welds, Electric wiring.
  Tell them to confirm each item one at a time saying "okay" to proceed.
- Keep answers short: 1 to 4 sentences maximum
- Be calm, practical, supportive, and direct
- Sound like an experienced warehouse trainer, not a chatbot
- Do not mention being an AI
- Respond in English

Tower / Aisle product reference (aisles 13–34):
${Object.entries(TOWER_MAP).map(([k, v]) => `  Aisle ${k}: ${v}`).join("\n")}

When answering pallet build questions, use the aisle product types above to give specific advice.

If the question is completely outside warehouse selecting topics, respond:
"I focus on warehouse selecting, pallet building, safety, and performance. Ask me something in that area."`;

const NOVA_SYSTEM_PROMPT_ES = `Eres NOVA Help, un entrenador de voz para selectores de almacén de órdenes.

Tu trabajo:
- Responde SOLO sobre temas de selección de almacén
- Enfócate en: construcción de tarimas, apilamiento, precisión de selección, error de selección,
  selección corta, selección de más, códigos de verificación de ranuras, ritmo, mejora de rendimiento,
  seguridad, ergonomía, hidratación, manejo de montacargas, andenes de puertas, etiquetas,
  lote completo, comandos de voz, confianza del principiante, errores comunes, diseño del almacén
- Mantén las respuestas cortas: máximo 1 a 4 oraciones
- Sé calmado, práctico, de apoyo y directo
- Suena como un entrenador experimentado de almacén, no como un chatbot
- No menciones ser una IA
- Responde en español

Referencia de productos por pasillo (pasillos 13–34):
${Object.entries(TOWER_MAP).map(([k, v]) => `  Pasillo ${k}: ${v}`).join("\n")}

Cuando respondas sobre construcción de tarimas, usa los tipos de productos por pasillo de arriba para dar consejos específicos.

Si la pregunta está completamente fuera de los temas de selección de almacén, responde:
"Me enfoco en selección de almacén, construcción de tarimas, seguridad y rendimiento. Pregúntame algo en esa área."`;

// ─── Route ────────────────────────────────────────────────────────────────────
router.post("/nova-help", async (req, res) => {
  const { question, language } = req.body as { question?: string; language?: string };

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ answer: "No question received." });
  }

  const isSpanish = typeof language === "string" && language.startsWith("es");
  const q = question.trim();

  // ── Build coach shortcut: detect pallet build questions with aisle numbers ──
  const aisles = extractAislesFromText(q);
  if (isBuildQuestion(q) && aisles.length > 0) {
    const result = buildPalletAdviceFromAisles(aisles, language ?? "en");
    const prefix = isSpanish
      ? `Para los pasillos ${aisles.join(", ")}: `
      : `For aisles ${aisles.join(", ")}: `;
    return res.json({ answer: prefix + result.advice });
  }

  // ── AI answer via Replit OpenAI proxy ─────────────────────────────────────
  const systemPrompt = isSpanish ? NOVA_SYSTEM_PROMPT_ES : NOVA_SYSTEM_PROMPT_EN;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 220,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: q },
      ],
    });

    const answer =
      completion.choices[0]?.message?.content?.trim() ||
      (isSpanish
        ? "Pregúntame sobre construcción de tarimas, seguridad, rendimiento o selección."
        : "Ask me anything about pallet building, safety, rate, or selecting.");

    return res.json({ answer });
  } catch (err) {
    console.error("NOVA Help AI error:", err);
    return res.status(500).json({
      answer: isSpanish
        ? "Tuve un problema respondiendo eso. Pregunta de nuevo sobre selección, seguridad o tarimas."
        : "I had trouble answering that. Ask again about selecting, safety, or pallet building.",
    });
  }
});

export default router;
