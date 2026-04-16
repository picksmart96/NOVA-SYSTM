import { Router } from "express";
import { db } from "@workspace/db";
import { novaMistakesTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// ── Log a mistake (called from voice session / trainer session) ───────────────
router.post("/log-mistake", requireAuth, async (req, res) => {
  try {
    const companyId = req.psaUser!.sub;
    const {
      selectorId,
      sessionId,
      mistakeType,
      description,
      expectedAction,
      actualAction,
      severity,
    } = req.body as {
      selectorId?:    string;
      sessionId?:     string;
      mistakeType?:   string;
      description?:   string;
      expectedAction?: string;
      actualAction?:  string;
      severity?:      string;
    };

    const [row] = await db
      .insert(novaMistakesTable)
      .values({
        companyId,
        selectorId: selectorId ?? null,
        sessionId:  sessionId ?? null,
        mistakeType:    mistakeType   ?? null,
        description:    description   ?? null,
        expectedAction: expectedAction ?? null,
        actualAction:   actualAction  ?? null,
        severity:       severity      ?? "medium",
      })
      .returning();

    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Error logging mistake");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Fetch mistakes (company-scoped, optional selectorId filter) ───────────────
router.get("/mistakes", requireAuth, async (req, res) => {
  try {
    const companyId  = req.psaUser!.sub;
    const selectorId = req.query.selectorId as string | undefined;
    const limit      = Math.min(parseInt((req.query.limit as string) ?? "100"), 200);

    const where = selectorId
      ? and(eq(novaMistakesTable.companyId, companyId), eq(novaMistakesTable.selectorId, selectorId))
      : eq(novaMistakesTable.companyId, companyId);

    const rows = await db
      .select()
      .from(novaMistakesTable)
      .where(where)
      .orderBy(desc(novaMistakesTable.createdAt))
      .limit(limit);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Error fetching mistakes");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Mistake counts grouped by selector ────────────────────────────────────────
router.get("/mistakes/summary", requireAuth, async (req, res) => {
  try {
    const companyId = req.psaUser!.sub;

    const rows = await db
      .select({
        selectorId:   novaMistakesTable.selectorId,
        total:        sql<number>`count(*)::int`,
        highSeverity: sql<number>`count(*) filter (where severity = 'high')::int`,
        lastMistake:  sql<string>`max(created_at)::text`,
      })
      .from(novaMistakesTable)
      .where(eq(novaMistakesTable.companyId, companyId))
      .groupBy(novaMistakesTable.selectorId)
      .orderBy(sql`count(*) desc`);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Error fetching mistake summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
