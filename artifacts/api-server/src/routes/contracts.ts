import { Router } from "express";
import { db } from "@workspace/db";
import { contractsTable } from "@workspace/db";
import { getUncachableStripeClient } from "../lib/stripeClient.js";
import { logger } from "../lib/logger.js";
import { eq } from "drizzle-orm";

const router = Router();

// Contract term → total contract value map
const CONTRACT_VALUES: Record<string, number> = {
  "Weekly":   1660,
  "Monthly":  6400,
  "1 Year":   69000,
  "2 Years":  120000,
  "3 Years":  165000,
  "5 Years":  250000,
  "10 Years": 450000,
};

// POST /api/contracts/create-checkout
// Body: { companyName, contactName, email, contractTerm, signedName }
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

  const appUrl = process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";

  try {
    // Save contract as pending before Stripe checkout
    const [contract] = await db
      .insert(contractsTable)
      .values({
        companyName,
        contactName: contactName ?? null,
        email:       email ?? null,
        contractTerm,
        weeklyPrice:        String(weeklyPrice),
        totalContractValue: String(totalValue),
        signedName:  signedName ?? null,
        signedAt:    signedName ? new Date() : null,
        status:      "pending",
      })
      .returning();

    // Create Stripe checkout
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

// GET /api/contracts — list all contracts (owner only in prod; no auth middleware here)
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

// PATCH /api/contracts/:id/activate  — called by webhook
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

export default router;
