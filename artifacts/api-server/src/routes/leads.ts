import { Router } from "express";
import { db } from "@workspace/db";
import { ownerLeadsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

// GET /api/leads — list all
router.get("/leads", async (req, res) => {
  try {
    const leads = await db
      .select()
      .from(ownerLeadsTable)
      .orderBy(desc(ownerLeadsTable.createdAt));
    res.json(leads);
  } catch (err) {
    req.log.error({ err }, "Error listing leads");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/leads/:id — single lead
router.get("/leads/:id", async (req, res) => {
  try {
    const [lead] = await db
      .select()
      .from(ownerLeadsTable)
      .where(eq(ownerLeadsTable.id, req.params.id));
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json(lead);
  } catch (err) {
    req.log.error({ err }, "Error getting lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/leads — create
router.post("/leads", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const [lead] = await db
      .insert(ownerLeadsTable)
      .values({
        companyName:    String(body.companyName ?? ""),
        contactName:    String(body.contactName ?? ""),
        contactRole:    String(body.contactRole ?? ""),
        email:          String(body.email ?? ""),
        phone:          String(body.phone ?? ""),
        city:           String(body.city ?? ""),
        state:          String(body.state ?? ""),
        warehouseType:  String(body.warehouseType ?? ""),
        status:         String(body.status ?? "new_lead"),
        nextAction:     String(body.nextAction ?? ""),
        nextActionDate: body.nextActionDate ? String(body.nextActionDate) : null,
        notes:          String(body.notes ?? ""),
        contractValue:  body.contractValue != null ? String(body.contractValue) : null,
        weeklyPrice:    body.weeklyPrice != null ? String(body.weeklyPrice) : null,
        demoDate:       body.demoDate ? String(body.demoDate) : null,
        proposalDate:   body.proposalDate ? String(body.proposalDate) : null,
        trialStart:     body.trialStart ? String(body.trialStart) : null,
        trialEnd:       body.trialEnd ? String(body.trialEnd) : null,
        contractSigned: body.contractSigned ? String(body.contractSigned) : null,
        renewalDate:    body.renewalDate ? String(body.renewalDate) : null,
      })
      .returning();
    res.status(201).json(lead);
  } catch (err) {
    req.log.error({ err }, "Error creating lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/leads/:id — update
router.put("/leads/:id", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;

    const patch: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const strFields = [
      "companyName","contactName","contactRole","email","phone",
      "city","state","warehouseType","status","nextAction","notes",
    ];
    const dateFields = [
      "nextActionDate","demoDate","proposalDate","trialStart",
      "trialEnd","contractSigned","renewalDate",
    ];
    const numericFields = ["contractValue","weeklyPrice"];

    for (const f of strFields) {
      if (body[f] !== undefined) patch[f] = String(body[f]);
    }
    for (const f of dateFields) {
      if (body[f] !== undefined) patch[f] = body[f] ? String(body[f]) : null;
    }
    for (const f of numericFields) {
      if (body[f] !== undefined) patch[f] = body[f] != null ? String(body[f]) : null;
    }

    const [lead] = await db
      .update(ownerLeadsTable)
      .set(patch)
      .where(eq(ownerLeadsTable.id, req.params.id))
      .returning();

    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json(lead);
  } catch (err) {
    req.log.error({ err }, "Error updating lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/leads/:id/sign — save signature
router.post("/leads/:id/sign", async (req, res) => {
  try {
    const { signedBy } = req.body as { signedBy: string };
    if (!signedBy?.trim()) {
      res.status(400).json({ error: "signedBy is required" });
      return;
    }
    const [lead] = await db
      .update(ownerLeadsTable)
      .set({ signedBy, signedAt: new Date(), updatedAt: new Date() })
      .where(eq(ownerLeadsTable.id, req.params.id))
      .returning();
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json(lead);
  } catch (err) {
    req.log.error({ err }, "Error signing lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/leads/:id
router.delete("/leads/:id", async (req, res) => {
  try {
    await db.delete(ownerLeadsTable).where(eq(ownerLeadsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
