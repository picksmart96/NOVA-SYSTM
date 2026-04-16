import { Router } from "express";
import { db } from "@workspace/db";
import { systemDefaultsTable, doorCodesTable, slotMasterTable, warehouseProfilesTable } from "@workspace/db";
import { eq, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

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
      const term = `%${search.trim()}%`;
      slots = await db
        .select()
        .from(slotMasterTable)
        .where(
          or(
            ilike(slotMasterTable.checkCode, term),
            ilike(slotMasterTable.label, term),
            sql`${slotMasterTable.aisle}::text ilike ${term}`,
            sql`${slotMasterTable.slot}::text ilike ${term}`
          )
        )
        .orderBy(slotMasterTable.aisle, slotMasterTable.slot);
    } else {
      slots = await db
        .select()
        .from(slotMasterTable)
        .orderBy(slotMasterTable.aisle, slotMasterTable.slot);
    }
    res.json(slots);
  } catch (err) {
    req.log.error({ err }, "Error listing slots");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Warehouse Profile ─────────────────────────────────────────────────────────

router.get("/warehouse/profile", requireAuth, async (req, res) => {
  try {
    const companyId = req.psaUser!.sub;
    const [profile] = await db
      .select()
      .from(warehouseProfilesTable)
      .where(eq(warehouseProfilesTable.companyId, companyId))
      .limit(1);
    if (!profile) {
      res.status(404).json({ error: "No profile found" });
      return;
    }
    res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Error fetching warehouse profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/warehouse/profile", requireAuth, async (req, res) => {
  try {
    const companyId = req.psaUser!.sub;
    const {
      systemType,
      locationFormat,
      checkMethod,
      palletType,
      performanceMetric,
      mainProblems,
    } = req.body as {
      systemType?: string;
      locationFormat?: string;
      checkMethod?: string;
      palletType?: string;
      performanceMetric?: string;
      mainProblems?: string[];
    };

    const existing = await db
      .select({ id: warehouseProfilesTable.id })
      .from(warehouseProfilesTable)
      .where(eq(warehouseProfilesTable.companyId, companyId))
      .limit(1);

    const values = {
      systemType: systemType ?? null,
      locationFormat: locationFormat ?? null,
      checkMethod: checkMethod ?? null,
      palletType: palletType ?? null,
      performanceMetric: performanceMetric ?? null,
      mainProblems: mainProblems ?? [],
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(warehouseProfilesTable)
        .set(values)
        .where(eq(warehouseProfilesTable.companyId, companyId));
    } else {
      await db.insert(warehouseProfilesTable).values({ companyId, ...values });
    }

    const [updated] = await db
      .select()
      .from(warehouseProfilesTable)
      .where(eq(warehouseProfilesTable.companyId, companyId))
      .limit(1);

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error saving warehouse profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
