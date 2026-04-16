import { Router } from "express";
import { getUncachableStripeClient } from "../lib/stripeClient.js";
import { logger } from "../lib/logger.js";

const router = Router();

const PLANS: Record<string, { unitAmount: number; interval: "week" | "month" | "year"; label: string }> = {
  weekly:  { unitAmount: 166000, interval: "week",  label: "Weekly"  },
  monthly: { unitAmount: 250000, interval: "month", label: "Monthly" },
  yearly:  { unitAmount: 6900000, interval: "year", label: "Annual"  },
};

// POST /create-checkout — creates a Stripe Checkout session
// Body: { email, billing: "weekly"|"monthly"|"yearly", userId? }
router.post("/create-checkout", async (req, res) => {
  const { email, billing = "weekly", userId } = req.body as {
    email?: string;
    billing?: string;
    userId?: string;
  };

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const plan = PLANS[billing] ?? PLANS.weekly;
  const appUrl = process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";

  try {
    const stripe = await getUncachableStripeClient();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `PickSmart NOVA — Company Plan (${plan.label})`,
              description:
                "Full platform: NOVA Voice, Trainer Portal, Mistake Tracking, Assignment Builder, Warehouse Config",
            },
            unit_amount: plan.unitAmount,
            recurring: { interval: plan.interval },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/upgrade`,
      metadata: { billing, email, userId: userId ?? "" },
    });

    logger.info(`[Stripe] Checkout session created — ${email} — ${plan.label} $${plan.unitAmount / 100}/${plan.interval}`);
    res.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[Stripe] createCheckout error");
    res.status(500).json({ error: msg });
  }
});

export default router;
