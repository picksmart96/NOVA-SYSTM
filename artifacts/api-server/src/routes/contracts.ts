import { Router } from "express";
import { db } from "@workspace/db";
import { contractsTable } from "@workspace/db";
import { getUncachableStripeClient } from "../lib/stripeClient.js";
import { logger } from "../lib/logger.js";
import { eq } from "drizzle-orm";

const router = Router();

// ─── constants ────────────────────────────────────────────────────────────────

const CONTRACT_VALUES: Record<string, number> = {
  "Weekly":   1660,
  "Monthly":  6400,
  "1 Year":   69000,
  "2 Years":  120000,
  "3 Years":  165000,
  "5 Years":  250000,
  "10 Years": 450000,
};

function getEndDate(term: string): Date {
  const d = new Date();
  if (term === "1 Year")    d.setFullYear(d.getFullYear() + 1);
  else if (term === "2 Years")  d.setFullYear(d.getFullYear() + 2);
  else if (term === "3 Years")  d.setFullYear(d.getFullYear() + 3);
  else if (term === "5 Years")  d.setFullYear(d.getFullYear() + 5);
  else if (term === "10 Years") d.setFullYear(d.getFullYear() + 10);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

// ─── POST /api/contracts/create-checkout ─────────────────────────────────────

router.post("/contracts/create-checkout", async (req, res) => {
  const { companyName, contactName, email, contractTerm = "1 Year", signedName } = req.body as {
    companyName?: string;
    contactName?: string;
    email?: string;
    contractTerm?: string;
    signedName?: string;
  };

  if (!companyName) {
    res.status(400).json({ error: "companyName is required" });
    return;
  }

  const weeklyPrice = 1660;
  const totalValue  = CONTRACT_VALUES[contractTerm] ?? 69000;
  const startDate   = new Date();
  const endDate     = getEndDate(contractTerm);
  const appUrl      = process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";

  try {
    const [contract] = await db
      .insert(contractsTable)
      .values({
        companyName,
        contactName:        contactName ?? null,
        email:              email ?? null,
        contractTerm,
        weeklyPrice:        String(weeklyPrice),
        totalContractValue: String(totalValue),
        signedName:         signedName ?? null,
        signedAt:           signedName ? new Date() : null,
        status:             "pending",
        startDate,
        endDate,
        autoRenew:          true,
        renewalAlertSent:   false,
      })
      .returning();

    const stripe = await getUncachableStripeClient();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode:                 "subscription",
      customer_email:       email ?? undefined,
      line_items: [
        {
          price_data: {
            currency:     "usd",
            product_data: {
              name:        `PickSmart NOVA — ${contractTerm} Contract`,
              description: `${companyName} · Voice-directed picking system · $${weeklyPrice.toLocaleString()}/week`,
            },
            unit_amount: weeklyPrice * 100,
            recurring:   { interval: "week" },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=contract`,
      cancel_url:  `${appUrl}/deal-sign`,
      metadata: {
        contract_id:   contract.id,
        company_name:  companyName,
        contract_term: contractTerm,
        type:          "contract",
      },
    });

    logger.info(`[Contracts] Checkout created — ${companyName} — ${contractTerm} — $${weeklyPrice}/wk`);
    res.json({ url: session.url, contractId: contract.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[Contracts] create-checkout error");
    res.status(500).json({ error: msg });
  }
});

// ─── GET /api/contracts ───────────────────────────────────────────────────────

router.get("/contracts", async (_req, res) => {
  try {
    const contracts = await db
      .select()
      .from(contractsTable)
      .orderBy(contractsTable.createdAt);
    res.json(contracts);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[Contracts] list error");
    res.status(500).json({ error: msg });
  }
});

// ─── PATCH /api/contracts/:id/activate  (webhook helper) ─────────────────────

router.patch("/contracts/:id/activate", async (req, res) => {
  const { id } = req.params;
  const { stripeCustomerId, stripeSubscriptionId } = req.body as {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  try {
    await db
      .update(contractsTable)
      .set({
        status:               "active",
        stripeCustomerId:     stripeCustomerId ?? null,
        stripeSubscriptionId: stripeSubscriptionId ?? null,
      })
      .where(eq(contractsTable.id, id));
    res.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

// ─── PATCH /api/contracts/:id/auto-renew ─────────────────────────────────────

router.patch("/contracts/:id/auto-renew", async (req, res) => {
  const { id } = req.params;
  const { autoRenew } = req.body as { autoRenew: boolean };
  try {
    await db
      .update(contractsTable)
      .set({ autoRenew })
      .where(eq(contractsTable.id, id));
    res.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

// ─── POST /api/contracts/cancel-subscription ─────────────────────────────────

router.post("/contracts/cancel-subscription", async (req, res) => {
  const { subscriptionId, contractId } = req.body as {
    subscriptionId: string;
    contractId?: string;
  };
  try {
    const stripe = await getUncachableStripeClient();
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    if (contractId) {
      await db
        .update(contractsTable)
        .set({ status: "canceling" })
        .where(eq(contractsTable.id, contractId));
    }
    logger.info(`[Contracts] Marked cancel_at_period_end: ${subscriptionId}`);
    res.json({ ok: true, message: "Subscription will cancel at end of billing period" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[Contracts] cancel-subscription error");
    res.status(500).json({ error: msg });
  }
});

// ─── POST /api/contracts/pause-subscription ──────────────────────────────────

router.post("/contracts/pause-subscription", async (req, res) => {
  const { subscriptionId } = req.body as { subscriptionId: string };
  try {
    const stripe = await getUncachableStripeClient();
    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: { behavior: "mark_uncollectible" },
    });
    logger.info(`[Contracts] Paused: ${subscriptionId}`);
    res.json({ ok: true, message: "Billing paused" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[Contracts] pause-subscription error");
    res.status(500).json({ error: msg });
  }
});

// ─── POST /api/contracts/resume-subscription ─────────────────────────────────

router.post("/contracts/resume-subscription", async (req, res) => {
  const { subscriptionId } = req.body as { subscriptionId: string };
  try {
    const stripe = await getUncachableStripeClient();
    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: "" as any, // null = resume
    });
    logger.info(`[Contracts] Resumed: ${subscriptionId}`);
    res.json({ ok: true, message: "Billing resumed" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[Contracts] resume-subscription error");
    res.status(500).json({ error: msg });
  }
});

// ─── POST /api/contracts/billing-portal ──────────────────────────────────────

router.post("/contracts/billing-portal", async (req, res) => {
  const { customerId } = req.body as { customerId: string };
  const appUrl = process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";
  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${appUrl}/owner`,
    });
    res.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[Contracts] billing-portal error");
    res.status(500).json({ error: msg });
  }
});

// ─── POST /api/contracts/invoices ────────────────────────────────────────────

router.post("/contracts/invoices", async (req, res) => {
  const { customerId } = req.body as { customerId: string };
  try {
    const stripe = await getUncachableStripeClient();
    const invoices = await stripe.invoices.list({ customer: customerId, limit: 20 });
    res.json(invoices.data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[Contracts] invoices error");
    res.status(500).json({ error: msg });
  }
});

export default router;
