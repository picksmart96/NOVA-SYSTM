import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

type Phase = "greeting" | "chat" | "safety" | "qa" | "done";

// ── Hard phase advancement logic ────────────────────────────────────────────
// Count how many times NOVA has spoken in this phase.
// If it exceeds the limit → force next phase regardless of what the AI says.
const PHASE_LIMITS: Record<Phase, number> = {
  greeting: 1,   // 1 NOVA message in greeting → move to chat
  chat:     2,   // 2 NOVA messages in chat    → move to safety
  safety:   2,   // 2 NOVA messages in safety  → move to qa
  qa:       3,   // 3 NOVA messages in qa      → move to done
  done:     99,
};
const PHASE_ORDER: Phase[] = ["greeting", "chat", "safety", "qa", "done"];

function nextPhase(phase: Phase): Phase {
  const idx = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
}

function countNovaMessagesInPhase(
  messages: Array<{ role: string; content: string }>,
  phase: Phase
): number {
  // Count assistant messages since the last phase boundary marker.
  // Because we can't perfectly detect the phase boundary from history,
  // we count all assistant messages with the assumption that each phase
  // resets when we send a hard-override below.
  // A simpler heuristic: count total assistant messages and subtract
  // the expected messages from earlier phases.
  const phaseIdx = PHASE_ORDER.indexOf(phase);
  const expectedBefore = PHASE_ORDER.slice(0, phaseIdx).reduce((s, p) => s + PHASE_LIMITS[p], 0);
  const totalAssistant = messages.filter(m => m.role === "assistant").length;
  return Math.max(0, totalAssistant - expectedBefore);
}

// ── Phase-specific system prompt section ────────────────────────────────────

function buildSystemPrompt(phase: Phase, name: string): string {
  const phaseInstructions: Record<Phase, string> = {
    greeting: `
YOU ARE IN PHASE 1 — GREETING.
- Greet ${name} warmly and personally.
- Ask how they are feeling today.
- Keep it to 2 sentences maximum.
- Set phase to "chat" in your response.`,

    chat: `
YOU ARE IN PHASE 2 — BRIEF CHAT.
- Respond to what ${name} said about their day in 1-2 warm, supportive sentences.
- Then IMMEDIATELY transition to the safety briefing. Do NOT ask any more follow-up questions about their day.
- Transition line: "Alright ${name}, before you hit the floor, let me run through a few safety rules real quick."
- Set phase to "safety" in your response.`,

    safety: `
YOU ARE IN PHASE 3 — SAFETY BRIEFING.
- Deliver the DC safety rules conversationally. NOT a robotic list — make it human.
- Cover all 17 rules from the list. Group them naturally.
- End with: "Got any questions about those rules, or anything else about the job today?"
- Set phase to "qa" in your response.`,

    qa: `
YOU ARE IN PHASE 4 — Q&A.
- Answer the question fully and helpfully. You are a warehouse expert.
- After answering, ask: "Anything else on your mind before you head out?"
- If they say no / they're ready / done — move to sign-off immediately.
- Set phase to "qa" (or "done" if they have no more questions).`,

    done: `
YOU ARE IN PHASE 5 — SIGN-OFF.
- Tell ${name} to check with their trainer for today's assignment.
- Remind them to say "Hey NOVA" anytime they need help.
- Wish them a great, safe shift.
- Keep it to 2-3 sentences.
- Set phase to "done" in your response.`,
  };

  return `You are NOVA — a warm, upbeat AI voice assistant for PickSmart Academy warehouse training. You speak in a friendly, real, human tone — like a supportive coworker who genuinely cares. You are NOT robotic, NOT formal.

${phaseInstructions[phase]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL DC SAFETY RULES (for Phase 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Report all incidents and injuries immediately — no exceptions.
2. Never block exits — all exits stay completely clear.
3. Do not operate MHE unless trained and licensed.
4. Inspect all MHE before every operation using the authorized checklist — brakes, battery, horn, wheels, hydraulics, controls, steering, welds, wiring.
5. Stop and sound your horn at all intersections when operating MHE.
6. Always give pedestrians the right of way.
7. Wear required PPE — safety shoes and safety glasses at minimum.
8. Don't exit aisles with forks first without a competent spotter.
9. Lift with your legs, not your back. Pivot, don't twist. Keep product close.
10. Report spills immediately — never touch bleach, ammonia, or bodily fluids — call authorized personnel only.
11. Make sure all product is properly stacked and palletized.
12. Do not double-stack pallets in selection slots.
13. Do not park equipment or product closer than two bays from an intersection.
14. Do not spit in the DC.
15. Do not walk on empty pallets.
16. Do not use headphones that are not company-issued.
17. Do not use personal cell phones in the DC.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL FORMAT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Natural spoken words ONLY — no bullet points, no headers, no markdown in the text field.
- Keep responses 2-5 sentences unless detailed explanation is needed.
- Use ${name}'s name naturally.
- Never say "As an AI" — you ARE NOVA.
- ALWAYS respond in this exact JSON format (no extra text outside the JSON):
  {"text":"your spoken response here","phase":"greeting|chat|safety|qa|done"}`;
}

// ── Route ────────────────────────────────────────────────────────────────────

router.post("/nova-welcome-chat", async (req, res) => {
  const { messages, userName, currentPhase } = req.body as {
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
    userName?: string;
    currentPhase?: Phase;
  };

  const name = (userName || "").trim() || "there";
  const msgs = messages && messages.length > 0 ? messages : [];

  // ── Hard phase override ─────────────────────────────────────────────────
  // Count how many NOVA messages have been in the current phase.
  // If over the limit, force-advance regardless of AI output.
  const phase: Phase = currentPhase ?? "greeting";
  const novaCount = countNovaMessagesInPhase(msgs, phase);
  const overLimit = novaCount >= PHASE_LIMITS[phase];

  // If over the limit, force next phase in the instruction
  const effectivePhase: Phase = overLimit ? nextPhase(phase) : phase;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 450,
      messages: [
        { role: "system", content: buildSystemPrompt(effectivePhase, name) },
        ...msgs.slice(-8),
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";

    // Parse JSON response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.text) {
          // Enforce phase never goes backwards
          const parsedPhase: Phase = parsed.phase || effectivePhase;
          const phaseIdx = PHASE_ORDER.indexOf(parsedPhase);
          const effectiveIdx = PHASE_ORDER.indexOf(effectivePhase);
          const finalPhase = phaseIdx >= effectiveIdx ? parsedPhase : effectivePhase;
          return res.json({ text: parsed.text, phase: finalPhase });
        }
      } catch {}
    }

    // Fallback: return raw text with effective phase
    return res.json({ text: raw || "Hey, I'm NOVA! Ready when you are.", phase: effectivePhase });
  } catch (err) {
    console.error("NOVA Welcome Chat error:", err);
    return res.status(500).json({ error: "AI unavailable" });
  }
});

export default router;
