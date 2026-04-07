import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const NOVA_SYSTEM_PROMPT = `You are NOVA Help, a warehouse order selector voice coach.

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

If the question is completely outside warehouse selecting topics, respond:
"I focus on warehouse selecting, pallet building, safety, and performance. Ask me something in that area."`;

router.post("/nova-help", async (req, res) => {
  const { question } = req.body as { question?: string };

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ answer: "No question received." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 200,
      messages: [
        { role: "system", content: NOVA_SYSTEM_PROMPT },
        { role: "user", content: question.trim() },
      ],
    });

    const answer =
      completion.choices[0]?.message?.content?.trim() ||
      "Ask me anything about pallet building, safety, rate, or selecting.";

    return res.json({ answer });
  } catch (err) {
    console.error("NOVA Help AI error:", err);
    return res.status(500).json({
      answer:
        "I had trouble answering that. Ask again about selecting, safety, or pallet building.",
    });
  }
});

export default router;
