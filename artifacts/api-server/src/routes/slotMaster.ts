import { Router } from "express";
import { db } from "@workspace/db";
import { slotMasterTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// GET /api/slot-master — list all slots for this company
router.get("/slot-master", requireAuth, async (req, res) => {
  try {
    const companyId = req.psaUser!.sub;
    const rows = await db
      .select()
      .from(slotMasterTable)
      .where(eq(slotMasterTable.companyId, companyId));
    rows.sort((a, b) => a.aisle - b.aisle || a.slot - b.slot);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "slot-master list error");
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/slot-master — upsert a single slot
router.post("/slot-master", requireAuth, async (req, res) => {
  try {
    const companyId = req.psaUser!.sub;
    const { aisle, slot, checkCode, zone, side, itemId } = req.body;

    if (!aisle || !slot || !checkCode) {
      res.status(400).json({ error: "aisle, slot, checkCode required" });
      return;
    }

    const [row] = await db
      .insert(slotMasterTable)
      .values({ companyId, aisle: Number(aisle), slot: Number(slot), checkCode: String(checkCode), zone: zone ?? null, side: side ?? null, itemId: itemId ?? null })
      .onConflictDoNothing()
      .returning();

    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "slot-master upsert error");
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/slot-master/bulk — bulk import slot master from CSV rows
router.post("/slot-master/bulk", requireAuth, async (req, res) => {
  try {
    const companyId = req.psaUser!.sub;
    const { rows } = req.body as { rows: { aisle: number; slot: number; checkCode: string; zone?: string; side?: string }[] };

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: "rows array required" });
      return;
    }

    const values = rows.map((r) => ({
      companyId,
      aisle: Number(r.aisle),
      slot: Number(r.slot),
      checkCode: String(r.checkCode),
      zone: r.zone ?? null,
      side: r.side ?? null,
    }));

    await db.insert(slotMasterTable).values(values).onConflictDoNothing();
    res.json({ inserted: values.length });
  } catch (err) {
    req.log.error({ err }, "slot-master bulk error");
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/slot-master/:id
router.delete("/slot-master/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(slotMasterTable).where(eq(slotMasterTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "slot-master delete error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
