import { Router } from "express";
import { db } from "@workspace/db";
import { assignmentsTable, assignmentStopsTable } from "@workspace/db";
import { eq, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/assignments/summary", async (req, res) => {
  try {
    const all = await db.select().from(assignmentsTable);
    const total = all.length;
    const active = all.filter((a) => a.status === "active").length;
    const pending = all.filter((a) => a.status === "pending").length;
    const completed = all.filter((a) => a.status === "completed").length;
    const withPerf = all.filter((a) => a.performancePercent != null);
    const avgPerformance = withPerf.length
      ? withPerf.reduce((s, a) => s + (a.performancePercent ?? 0), 0) / withPerf.length
      : 0;
    const totalCasesToday = all.reduce((s, a) => s + a.totalCases, 0);
    res.json({ total, active, pending, completed, avgPerformance, totalCasesToday });
  } catch (err) {
    req.log.error({ err }, "Error getting summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/assignments/mine ─────────────────────────────────────────────────
// Returns assignments assigned TO this user (as selector) PLUS assignments this
// user created as a trainer — so both sides of the relationship are visible.
router.get("/assignments/mine", requireAuth, async (req, res) => {
  try {
    const userId = req.psaUser!.sub;
    const assignments = await db
      .select()
      .from(assignmentsTable)
      .where(
        or(
          eq(assignmentsTable.selectorUserId, userId),
          eq(assignmentsTable.trainerUserId,  userId),
        )
      );
    res.json(assignments);
  } catch (err) {
    req.log.error({ err }, "Error fetching mine assignments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/assignments", async (req, res) => {
  try {
    const assignments = await db.select().from(assignmentsTable);
    // Attach stop counts
    const counts = await db
      .select({
        assignmentId: assignmentStopsTable.assignmentId,
        stops: sql<number>`count(*)`.mapWith(Number),
      })
      .from(assignmentStopsTable)
      .groupBy(assignmentStopsTable.assignmentId);
    const countMap = Object.fromEntries(counts.map(c => [c.assignmentId, c.stops]));
    const result = assignments.map(a => ({ ...a, stops: countMap[a.id] ?? 0 }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing assignments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/assignments", async (req, res) => {
  try {
    const body = req.body;
    const id = `asgn-${randomUUID().slice(0, 8)}`;
    const [created] = await db
      .insert(assignmentsTable)
      .values({
        id,
        assignmentNumber: body.assignmentNumber,
        title: body.title,
        selectorUserId: body.selectorUserId ?? null,
        trainerUserId: body.trainerUserId ?? null,
        startAisle: body.startAisle,
        endAisle: body.endAisle,
        totalCases: body.totalCases,
        totalCube: body.totalCube,
        totalPallets: body.totalPallets,
        doorNumber: body.doorNumber,
        printerNumber: body.printerNumber ?? 307,
        alphaLabelNumber: body.alphaLabelNumber ?? 242,
        bravoLabelNumber: body.bravoLabelNumber ?? 578,
        status: body.status ?? "pending",
        voiceMode: body.voiceMode ?? "training",
        goalTimeMinutes: body.goalTimeMinutes ?? null,
        goalTimeSeconds: body.goalTimeSeconds ?? 0,
        percentComplete: 0,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Error creating assignment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/assignments/:id", async (req, res) => {
  try {
    const [assignment] = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, req.params.id));
    if (!assignment) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(assignment);
  } catch (err) {
    req.log.error({ err }, "Error getting assignment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/assignments/:id", async (req, res) => {
  try {
    const body = req.body;
    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.voiceMode !== undefined) updates.voiceMode = body.voiceMode;
    if (body.selectorUserId !== undefined) updates.selectorUserId = body.selectorUserId;
    if (body.percentComplete !== undefined) updates.percentComplete = body.percentComplete;
    if (body.performancePercent !== undefined) updates.performancePercent = body.performancePercent;
    if (body.startedAt !== undefined) updates.startedAt = body.startedAt ? new Date(body.startedAt) : null;
    if (body.completedAt !== undefined) updates.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    if (body.totalDurationSeconds !== undefined) updates.totalDurationSeconds = body.totalDurationSeconds;

    const [updated] = await db
      .update(assignmentsTable)
      .set(updates)
      .where(eq(assignmentsTable.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating assignment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/assignments/:id/stops", async (req, res) => {
  try {
    const stops = await db
      .select()
      .from(assignmentStopsTable)
      .where(eq(assignmentStopsTable.assignmentId, req.params.id));
    stops.sort((a, b) => a.stopOrder - b.stopOrder);
    res.json(stops);
  } catch (err) {
    req.log.error({ err }, "Error listing stops");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/assignments/:id/stops/bulk ─────────────────────────────────────
// Bulk-create stops for an existing assignment (CSV import or manual list).
router.post("/assignments/:id/stops/bulk", async (req, res) => {
  try {
    const { stops } = req.body as {
      stops: { aisle: number; slot: number; qty: number; checkCode: string; stopOrder?: number }[];
    };

    if (!Array.isArray(stops) || stops.length === 0) {
      res.status(400).json({ error: "stops array required" });
      return;
    }

    const values = stops.map((s, i) => ({
      id: `stop-${randomUUID().slice(0, 8)}`,
      assignmentId: req.params.id,
      aisle: Number(s.aisle),
      slot: Number(s.slot),
      qty: Number(s.qty),
      checkCode: String(s.checkCode).trim(),
      stopOrder: s.stopOrder ?? i,
      status: "pending" as const,
    }));

    const created = await db.insert(assignmentStopsTable).values(values).returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Error bulk-creating stops");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/assignments/generate-random ────────────────────────────────────
// Generate a random training assignment (20 stops) with stops, return full object.
router.post("/assignments/generate-random", async (req, res) => {
  try {
    const { stopCount = 20, startAisle = 10, endAisle = 30 } = req.body ?? {};

    const id = `asgn-${randomUUID().slice(0, 8)}`;
    const assignmentNumber = Math.floor(1000 + Math.random() * 9000);

    const stops: { aisle: number; slot: number; qty: number; checkCode: string; stopOrder: number }[] = [];
    for (let i = 0; i < Number(stopCount); i++) {
      stops.push({
        aisle: Math.floor(Number(startAisle) + Math.random() * (Number(endAisle) - Number(startAisle) + 1)),
        slot: Math.floor(Math.random() * 200) + 1,
        qty: Math.floor(Math.random() * 10) + 1,
        checkCode: String(Math.floor(100 + Math.random() * 900)),
        stopOrder: i,
      });
    }
    stops.sort((a, b) => a.aisle - b.aisle || a.slot - b.slot);
    stops.forEach((s, i) => { s.stopOrder = i; });

    const totalCases = stops.reduce((sum, s) => sum + s.qty, 0);

    const [assignment] = await db
      .insert(assignmentsTable)
      .values({
        id,
        assignmentNumber,
        title: `Training Run #${assignmentNumber}`,
        startAisle: stops[0]?.aisle ?? Number(startAisle),
        endAisle: stops[stops.length - 1]?.aisle ?? Number(endAisle),
        totalCases,
        totalCube: 0,
        totalPallets: 1,
        doorNumber: Math.floor(Math.random() * 20) + 1,
        status: "pending",
        voiceMode: "training",
        percentComplete: 0,
      })
      .returning();

    const stopValues = stops.map((s) => ({
      id: `stop-${randomUUID().slice(0, 8)}`,
      assignmentId: id,
      ...s,
      status: "pending" as const,
    }));
    const createdStops = await db.insert(assignmentStopsTable).values(stopValues).returning();

    res.status(201).json({ assignment, stops: createdStops });
  } catch (err) {
    req.log.error({ err }, "Error generating random assignment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/assignments/:id/stops/:stopId", async (req, res) => {
  try {
    const body = req.body;
    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.arrivedAt !== undefined) updates.arrivedAt = body.arrivedAt ? new Date(body.arrivedAt) : null;
    if (body.verifiedAt !== undefined) updates.verifiedAt = body.verifiedAt ? new Date(body.verifiedAt) : null;
    if (body.pickedAt !== undefined) updates.pickedAt = body.pickedAt ? new Date(body.pickedAt) : null;
    if (body.dwellSeconds !== undefined) updates.dwellSeconds = body.dwellSeconds;

    const [updated] = await db
      .update(assignmentStopsTable)
      .set(updates)
      .where(eq(assignmentStopsTable.id, req.params.stopId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating stop");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
