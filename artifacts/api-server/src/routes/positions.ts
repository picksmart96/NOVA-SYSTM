import { Router } from "express";
import { db } from "@workspace/db";
import { psaSelectorPositions, psaCoachingMessages, psaUsers } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

async function resolveUser(sub: string) {
  const [u] = await db.select().from(psaUsers).where(eq(psaUsers.id, sub)).limit(1);
  return u ?? null;
}

// ── POST /api/positions — selector updates own position
router.post("/positions", requireAuth, async (req, res) => {
  try {
    const me = await resolveUser(req.psaUser!.sub);
    const { currentAisle, currentSlot, nextAisle, nextSlot, status = "active" } = req.body as {
      currentAisle?: string; currentSlot?: string; nextAisle?: string; nextSlot?: string; status?: string;
    };
    const [row] = await db.insert(psaSelectorPositions).values({
      selectorId: me?.id ?? req.psaUser!.sub,
      selectorName: me?.fullName ?? req.psaUser!.username,
      companyId: me?.warehouseSlug ?? null,
      currentAisle: currentAisle ?? null,
      currentSlot: currentSlot ?? null,
      nextAisle: nextAisle ?? null,
      nextSlot: nextSlot ?? null,
      status,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: psaSelectorPositions.selectorId,
      set: {
        selectorName: me?.fullName ?? req.psaUser!.username,
        currentAisle: currentAisle ?? null,
        currentSlot: currentSlot ?? null,
        nextAisle: nextAisle ?? null,
        nextSlot: nextSlot ?? null,
        status,
        updatedAt: new Date(),
      },
    }).returning();
    res.json({ ok: true, position: row });
  } catch (err) {
    req.log?.error({ err }, "positions POST error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/positions — supervisor sees all active selectors
router.get("/positions", requireAuth, async (req, res) => {
  try {
    const me = await resolveUser(req.psaUser!.sub);
    let rows;
    if (me?.isMaster || me?.role === "owner") {
      rows = await db.select().from(psaSelectorPositions).orderBy(desc(psaSelectorPositions.updatedAt));
    } else if (me?.warehouseSlug) {
      rows = await db.select().from(psaSelectorPositions)
        .where(eq(psaSelectorPositions.companyId, me.warehouseSlug))
        .orderBy(desc(psaSelectorPositions.updatedAt));
    } else {
      rows = [];
    }
    res.json({ positions: rows });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/coaching — supervisor sends coaching to selector
router.post("/coaching", requireAuth, async (req, res) => {
  try {
    const me = await resolveUser(req.psaUser!.sub);
    const { selectorId, message } = req.body as { selectorId: string; message: string };
    if (!selectorId || !message) { res.status(400).json({ error: "selectorId and message required" }); return; }
    const [row] = await db.insert(psaCoachingMessages).values({
      selectorId,
      fromUserId: me?.id ?? req.psaUser!.sub,
      fromName: me?.fullName ?? req.psaUser!.username,
      message,
    }).returning();
    res.status(201).json({ ok: true, coaching: row });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/coaching/mine — selector polls for their coaching messages
router.get("/coaching/mine", requireAuth, async (req, res) => {
  try {
    const me = await resolveUser(req.psaUser!.sub);
    const rows = await db.select().from(psaCoachingMessages)
      .where(eq(psaCoachingMessages.selectorId, me?.id ?? req.psaUser!.sub))
      .orderBy(desc(psaCoachingMessages.createdAt))
      .limit(20);
    res.json({ messages: rows });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /api/coaching/:id/read
router.patch("/coaching/:id/read", requireAuth, async (req, res) => {
  try {
    await db.update(psaCoachingMessages).set({ read: true }).where(eq(psaCoachingMessages.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
