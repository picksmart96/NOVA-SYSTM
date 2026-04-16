import { Router } from "express";
import { db } from "@workspace/db";
import { psaAlerts, psaAuditLogs, psaUsers } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

async function resolveUser(sub: string) {
  const [u] = await db.select().from(psaUsers).where(eq(psaUsers.id, sub)).limit(1);
  return u ?? null;
}

// ── POST /api/alerts
router.post("/alerts", requireAuth, async (req, res) => {
  try {
    const { type, message, severity = "medium", meta, targetUserId } = req.body as {
      type: string; message: string; severity?: string; meta?: object; targetUserId?: string;
    };
    if (!type || !message) { res.status(400).json({ error: "type and message required" }); return;  }
    const me = await resolveUser(req.psaUser!.sub);
    const [row] = await db.insert(psaAlerts).values({
      type, message, severity,
      companyId: me?.warehouseSlug ?? null,
      userId: targetUserId ?? me?.id ?? null,
      meta: meta ?? null,
    }).returning();
    res.status(201).json({ ok: true, alert: row });
  } catch (err) {
    req.log?.error({ err }, "alerts POST error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/alerts
router.get("/alerts", requireAuth, async (req, res) => {
  try {
    const me = await resolveUser(req.psaUser!.sub);
    let rows;
    if (me?.isMaster || me?.role === "owner") {
      rows = await db.select().from(psaAlerts).orderBy(desc(psaAlerts.createdAt)).limit(200);
    } else if (me?.warehouseSlug) {
      rows = await db.select().from(psaAlerts)
        .where(eq(psaAlerts.companyId, me.warehouseSlug))
        .orderBy(desc(psaAlerts.createdAt)).limit(100);
    } else {
      rows = [];
    }
    res.json({ alerts: rows });
  } catch (err) {
    req.log?.error({ err }, "alerts GET error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /api/alerts/:id/read
router.patch("/alerts/:id/read", requireAuth, async (req, res) => {
  try {
    await db.update(psaAlerts).set({ read: true }).where(eq(psaAlerts.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/alerts/read-all
router.post("/alerts/read-all", requireAuth, async (req, res) => {
  try {
    const me = await resolveUser(req.psaUser!.sub);
    if (me?.isMaster || me?.role === "owner") {
      await db.update(psaAlerts).set({ read: true });
    } else if (me?.warehouseSlug) {
      await db.update(psaAlerts).set({ read: true }).where(eq(psaAlerts.companyId, me.warehouseSlug));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/audit
router.get("/audit", requireAuth, async (req, res) => {
  try {
    const me = await resolveUser(req.psaUser!.sub);
    let rows;
    if (me?.isMaster || me?.role === "owner") {
      rows = await db.select().from(psaAuditLogs).orderBy(desc(psaAuditLogs.createdAt)).limit(500);
    } else if (me?.warehouseSlug) {
      rows = await db.select().from(psaAuditLogs)
        .where(eq(psaAuditLogs.companyId, me.warehouseSlug))
        .orderBy(desc(psaAuditLogs.createdAt)).limit(200);
    } else {
      rows = [];
    }
    res.json({ logs: rows });
  } catch (err) {
    req.log?.error({ err }, "audit GET error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/audit/log
router.post("/audit/log", requireAuth, async (req, res) => {
  try {
    const me = await resolveUser(req.psaUser!.sub);
    const { action, entity, entityId, details } = req.body as {
      action: string; entity?: string; entityId?: string; details?: object;
    };
    await db.insert(psaAuditLogs).values({
      userId: me?.id ?? req.psaUser!.sub,
      companyId: me?.warehouseSlug ?? null,
      action, entity: entity ?? null, entityId: entityId ?? null,
      details: details ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
