import { Router } from "express";
import { db } from "@workspace/db";
import { trainingModulesTable, leaderboardTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

router.get("/training/modules", async (req, res) => {
  try {
    const modules = await db.select().from(trainingModulesTable).orderBy(asc(trainingModulesTable.title));
    res.json(modules);
  } catch (err) {
    req.log.error({ err }, "Error listing modules");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/training/modules/:id", async (req, res) => {
  try {
    const [module] = await db
      .select()
      .from(trainingModulesTable)
      .where(eq(trainingModulesTable.id, req.params.id));
    if (!module) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(module);
  } catch (err) {
    req.log.error({ err }, "Error getting module");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/training/leaderboard", async (req, res) => {
  try {
    const entries = await db.select().from(leaderboardTable).orderBy(asc(leaderboardTable.rank));
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Error getting leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
