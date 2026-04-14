import { Router } from "express";
import { db } from "@workspace/db";
import { novaMetricsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// POST /api/track — record an event
router.post("/track", async (req, res) => {
  try {
    const { event, dealId, userId, meta } = req.body as {
      event: string;
      dealId?: string;
      userId?: string;
      meta?: string;
    };
    if (!event) {
      res.status(400).json({ error: "event is required" });
      return;
    }
    const [row] = await db
      .insert(novaMetricsTable)
      .values({ event, dealId: dealId ?? null, userId: userId ?? null, meta: meta ?? null })
      .returning();
    res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Error tracking event");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/metrics — summary counts for owner panel
router.get("/metrics", async (req, res) => {
  try {
    const rows = await db
      .select({
        event: novaMetricsTable.event,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(novaMetricsTable)
      .groupBy(novaMetricsTable.event);

    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.event] = r.count;

    const chat   = counts["chat_started"]        ?? 0;
    const trial  = counts["trial_clicked"]        ?? 0;
    const paid   = counts["payment_completed"]    ?? 0;
    const conversion = trial > 0 ? ((paid / trial) * 100).toFixed(1) : "0.0";

    res.json({ chat, trial, paid, conversion });
  } catch (err) {
    req.log.error({ err }, "Error fetching metrics");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/metrics/events — recent raw events (last 200)
router.get("/metrics/events", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(novaMetricsTable)
      .orderBy(sql`created_at desc`)
      .limit(200);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Error fetching metric events");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
