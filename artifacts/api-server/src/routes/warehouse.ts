import { Router } from "express";
import { db } from "@workspace/db";
import { systemDefaultsTable, doorCodesTable, slotMasterTable } from "@workspace/db";
import { eq, ilike, or, cast, sql } from "drizzle-orm";

const router = Router();

router.get("/warehouse/defaults", async (req, res) => {
  try {
    const [defaults] = await db.select().from(systemDefaultsTable);
    if (!defaults) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(defaults);
  } catch (err) {
    req.log.error({ err }, "Error getting defaults");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/warehouse/door-codes", async (req, res) => {
  try {
    const doors = await db.select().from(doorCodesTable);
    res.json(doors);
  } catch (err) {
    req.log.error({ err }, "Error listing door codes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/warehouse/slots", async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    let slots;
    if (search && search.trim()) {
      slots = await db
        .select()
        .from(slotMasterTable)
        .where(
          or(
            ilike(slotMasterTable.checkCode, `%${search}%`),
            ilike(slotMasterTable.label, `%${search}%`),
            ilike(slotMasterTable.level ?? "", `%${search}%`)
          )
        );
    } else {
      slots = await db.select().from(slotMasterTable);
    }
    res.json(slots);
  } catch (err) {
    req.log.error({ err }, "Error listing slots");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
