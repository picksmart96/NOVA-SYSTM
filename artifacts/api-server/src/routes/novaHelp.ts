import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const NOVA_SYSTEM_PROMPT_EN = `You are NOVA Help, a warehouse order selector voice coach.

Your job:
- Answer ONLY about warehouse order selecting topics
- Focus on: pallet building, stacking, picking accuracy, mispick, short pick, over pick,
  slot check codes, pacing, rate improvement, safety, ergonomics, hydration,
  pallet jack handling, door staging, labels, batch complete, voice picking commands,
  beginner confidence, common mistakes, warehouse layout
- Keep answers short: 1 to 4 sentences maximum
- Be calm, practical, supportive, and direct
- Sound like an experienced warehouse trainer, not a chatbot
- Do not mention being an AI
- Respond in English

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

Si la pregunta está completamente fuera de los temas de selección de almacén, responde:
"Me enfoco en selección de almacén, construcción de tarimas, seguridad y rendimiento. Pregúntame algo en esa área."`;

router.post("/nova-help", async (req, res) => {
  const { question, language } = req.body as { question?: string; language?: string };

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ answer: "No question received." });
  }

  const isSpanish = typeof language === "string" && language.startsWith("es");
  const systemPrompt = isSpanish ? NOVA_SYSTEM_PROMPT_ES : NOVA_SYSTEM_PROMPT_EN;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question.trim() },
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
