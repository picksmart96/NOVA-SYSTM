import { Router } from "express";
import { db } from "@workspace/db";
import { novaSessions, novaSessionMessages } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

// POST /nova-sessions — create or update a session
router.post("/nova-sessions", async (req, res) => {
  const {
    id, visitorName, companyName, email, phone, painPoint,
    stageReached, trialClicked, trialSubmitted, messageCount, source,
  } = req.body as Record<string, unknown>;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "session id required" });
  }

  try {
    await db
      .insert(novaSessions)
      .values({
        id: String(id),
        visitorName:    String(visitorName ?? ""),
        companyName:    String(companyName ?? ""),
        email:          String(email ?? ""),
        phone:          String(phone ?? ""),
        painPoint:      String(painPoint ?? ""),
        stageReached:   String(stageReached ?? "greeting"),
        trialClicked:   Boolean(trialClicked ?? false),
        trialSubmitted: Boolean(trialSubmitted ?? false),
        messageCount:   Number(messageCount ?? 0),
        source:         String(source ?? "meet_nova"),
      })
      .onConflictDoUpdate({
        target: novaSessions.id,
        set: {
          visitorName:    sql`excluded.visitor_name`,
          companyName:    sql`excluded.company_name`,
          email:          sql`excluded.email`,
          phone:          sql`excluded.phone`,
          painPoint:      sql`excluded.pain_point`,
          stageReached:   sql`excluded.stage_reached`,
          trialClicked:   sql`excluded.trial_clicked`,
          trialSubmitted: sql`excluded.trial_submitted`,
          messageCount:   sql`excluded.message_count`,
          updatedAt:      sql`now()`,
        },
      });

    res.json({ ok: true });
  } catch (err) {
    console.error("nova-sessions upsert error:", err);
    res.status(500).json({ error: "db error" });
  }
});

// POST /nova-sessions/:id/messages — save a batch of messages
router.post("/nova-sessions/:id/messages", async (req, res) => {
  const sessionId = req.params.id;
  const { messages } = req.body as { messages?: Array<{ role: string; content: string }> };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  try {
    await db.insert(novaSessionMessages).values(
      messages.map((m) => ({
        sessionId,
        role:    m.role || "user",
        content: m.content || "",
      }))
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("nova-session-messages insert error:", err);
    res.status(500).json({ error: "db error" });
  }
});

// GET /nova-sessions — list all sessions (owner panel)
router.get("/nova-sessions", async (req, res) => {
  try {
    const sessions = await db
      .select()
      .from(novaSessions)
      .orderBy(desc(novaSessions.createdAt));
    res.json(sessions);
  } catch (err) {
    console.error("nova-sessions list error:", err);
    res.status(500).json({ error: "db error" });
  }
});

// GET /nova-sessions/:id/messages — get full conversation for one session
router.get("/nova-sessions/:id/messages", async (req, res) => {
  try {
    const msgs = await db
      .select()
      .from(novaSessionMessages)
      .where(eq(novaSessionMessages.sessionId, req.params.id))
      .orderBy(novaSessionMessages.createdAt);
    res.json(msgs);
  } catch (err) {
    console.error("nova-session-messages fetch error:", err);
    res.status(500).json({ error: "db error" });
  }
});

export default router;
