import { Router } from "express";
import { db } from "@workspace/db";
import { pickingSessionEventsTable, pickingReportsTable, psaUsers, assignmentsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ── POST /api/picking-events  (log a single event during a session) ──────────
router.post("/picking-events", requireAuth, async (req, res) => {
  const { assignmentId, stopId, eventType, expectedValue, actualValue, slotTimeSeconds } = req.body as {
    assignmentId: string;
    stopId?: string;
    eventType: string;
    expectedValue?: string;
    actualValue?: string;
    slotTimeSeconds?: number;
  };
  if (!assignmentId || !eventType) {
    res.status(400).json({ error: "assignmentId and eventType are required" });
    return;
  }
  try {
    const [row] = await db
      .insert(pickingSessionEventsTable)
      .values({
        assignmentId,
        stopId:          stopId ?? null,
        traineeId:       req.psaUser!.sub,
        eventType,
        expectedValue:   expectedValue ?? null,
        actualValue:     actualValue ?? null,
        slotTimeSeconds: slotTimeSeconds ?? null,
      })
      .returning();
    res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Error saving picking event");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/picking-reports  (generate + save final session report) ─────────
router.post("/picking-reports", requireAuth, async (req, res) => {
  const {
    assignmentId, totalCases, pickedCases, totalDurationSeconds,
    goalTimeMinutes, wrongCodeCount, overPickCount, shortPickCount, avgSlotTimeSeconds,
    uphActual, uphStandard, efficiencyPercent, performanceBand,
  } = req.body as {
    assignmentId: string;
    totalCases: number;
    pickedCases: number;
    totalDurationSeconds: number;
    goalTimeMinutes: number;
    wrongCodeCount: number;
    overPickCount: number;
    shortPickCount: number;
    avgSlotTimeSeconds: number;
    uphActual: number;
    uphStandard: number;
    efficiencyPercent: number;
    performanceBand: string;
  };
  if (!assignmentId) {
    res.status(400).json({ error: "assignmentId required" });
    return;
  }

  try {
    const [user] = await db.select().from(psaUsers).where(eq(psaUsers.id, req.psaUser!.sub));
    const [assignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, assignmentId));
    const traineeName = user?.fullName ?? req.psaUser!.username;

    // ── Generate AI feedback ────────────────────────────────────────────────
    const systemPrompt = `You are NOVA, a warehouse training AI coach. You generate concise, actionable post-session performance reports for distribution center trainees. Be direct, encouraging, and specific. Use warehouse language naturally.`;

    const userMsg = `Generate a post-session picking report for trainee: ${traineeName}

SESSION STATS:
- Cases Picked: ${pickedCases} / ${totalCases}
- Time: ${Math.round(totalDurationSeconds / 60)} min (goal: ${goalTimeMinutes} min)
- UPH: ${uphActual} (standard: ${uphStandard})
- Efficiency: ${efficiencyPercent}% (${performanceBand})
- Wrong Check Codes: ${wrongCodeCount}
- Over Picks: ${overPickCount}
- Short Picks: ${shortPickCount}
- Avg Slot Time: ${avgSlotTimeSeconds ? avgSlotTimeSeconds.toFixed(1) : "N/A"}s

Respond with JSON only (no markdown):
{
  "nova_feedback": "2-3 sentence overall performance summary in NOVA's voice — warm, direct, real",
  "improvements": "Top 2-3 specific things to improve (1-2 sentences each)",
  "mistake_summary": "Brief analysis of the mistake patterns (1-2 sentences)",
  "how_to_improve": "Concrete tips to avoid these mistakes next session (2-4 bullet points as one paragraph)"
}`;

    let novaFeedback = "Good session! Keep working on your rhythm.";
    let improvements = "Focus on check code accuracy and maintaining your pace.";
    let mistakeSummary = "Some check code errors noted. Keep reading your location labels carefully.";
    let howToImprove = "Slow down at each slot and say the check code out loud before entering it. Practice your transitions to build pace.";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim() || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        novaFeedback  = parsed.nova_feedback  ?? novaFeedback;
        improvements  = parsed.improvements   ?? improvements;
        mistakeSummary = parsed.mistake_summary ?? mistakeSummary;
        howToImprove  = parsed.how_to_improve  ?? howToImprove;
      }
    } catch (aiErr) {
      req.log.warn({ err: aiErr }, "AI feedback failed, using defaults");
    }

    const today = new Date().toISOString().slice(0, 10);
    const [report] = await db
      .insert(pickingReportsTable)
      .values({
        assignmentId,
        traineeId:            user?.id ?? null,
        traineeUsername:      user?.username ?? null,
        traineeName:          traineeName,
        trainerUserId:        assignment?.trainerUserId ?? null,
        reportDate:           today,
        totalCases,
        pickedCases,
        totalDurationSeconds,
        goalTimeMinutes,
        uphActual,
        uphStandard,
        efficiencyPercent,
        wrongCodeCount,
        overPickCount,
        shortPickCount,
        avgSlotTimeSeconds:   avgSlotTimeSeconds ?? null,
        performanceBand,
        novaFeedback,
        improvements,
        mistakeSummary,
        howToImprove,
      })
      .returning();

    res.status(201).json({ ok: true, report });
  } catch (err) {
    req.log.error({ err }, "Error creating picking report");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/picking-reports/mine  (trainee: own reports) ────────────────────
router.get("/picking-reports/mine", requireAuth, async (req, res) => {
  try {
    const reports = await db
      .select()
      .from(pickingReportsTable)
      .where(eq(pickingReportsTable.traineeId, req.psaUser!.sub))
      .orderBy(desc(pickingReportsTable.createdAt))
      .limit(30);
    res.json(reports);
  } catch (err) {
    req.log.error({ err }, "Error fetching trainee reports");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/picking-reports/trainer  (trainer: all trainee reports) ──────────
router.get("/picking-reports/trainer", requireAuth, async (req, res) => {
  try {
    const reports = await db
      .select()
      .from(pickingReportsTable)
      .where(eq(pickingReportsTable.trainerUserId, req.psaUser!.sub))
      .orderBy(desc(pickingReportsTable.createdAt))
      .limit(100);
    res.json(reports);
  } catch (err) {
    req.log.error({ err }, "Error fetching trainer reports");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/picking-reports/all  (owner/supervisor/admin: all reports) ───────
router.get("/picking-reports/all", requireAuth, async (req, res) => {
  const role = req.psaUser!.role;
  if (!["owner", "supervisor", "admin"].includes(role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const reports = await db
      .select()
      .from(pickingReportsTable)
      .orderBy(desc(pickingReportsTable.createdAt))
      .limit(200);
    res.json(reports);
  } catch (err) {
    req.log.error({ err }, "Error fetching all reports");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/picking-reports/trainee/:traineeId  (trainer views specific trainee) ──
router.get("/picking-reports/trainee/:traineeId", requireAuth, async (req, res) => {
  try {
    const reports = await db
      .select()
      .from(pickingReportsTable)
      .where(eq(pickingReportsTable.traineeId, req.params.traineeId))
      .orderBy(desc(pickingReportsTable.createdAt))
      .limit(50);
    res.json(reports);
  } catch (err) {
    req.log.error({ err }, "Error fetching trainee reports");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/assignments/mine  (trainee: their pending/active assignment) ─────
router.get("/assignments/mine", requireAuth, async (req, res) => {
  try {
    const assignments = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.selectorUserId, req.psaUser!.sub))
      .orderBy(desc(assignmentsTable.id))
      .limit(10);
    res.json(assignments);
  } catch (err) {
    req.log.error({ err }, "Error fetching trainee assignments");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/users/selectors  (trainer: list trainees to assign) ─────────────
router.get("/users/selectors", requireAuth, async (req, res) => {
  try {
    const selectors = await db
      .select({
        id:            psaUsers.id,
        username:      psaUsers.username,
        fullName:      psaUsers.fullName,
        accountNumber: psaUsers.accountNumber,
        role:          psaUsers.role,
      })
      .from(psaUsers)
      .where(eq(psaUsers.role, "selector"))
      .limit(100);
    res.json(selectors);
  } catch (err) {
    req.log.error({ err }, "Error fetching selectors");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
