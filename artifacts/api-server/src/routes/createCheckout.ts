import { Router } from "express";
import { getUncachableStripeClient } from "../lib/stripeClient.js";
import { logger } from "../lib/logger.js";

const router = Router();

// POST /create-checkout  — creates a Stripe Checkout session
// Body: { email, billing: "monthly"|"yearly" }
router.post("/create-checkout", async (req, res) => {
  const { email, billing = "monthly" } = req.body as {
    email?: string;
    billing?: string;
  };

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const isYearly = billing === "yearly";
  const unitAmount = isYearly ? 25000 : 2500; // $250/yr or $25/mo in cents
  const interval   = isYearly ? "year" : "month";

  const appUrl =
    process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";

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
              name: "PickSmart NOVA — Professional Single",
              description:
                "Full platform: Training, NOVA Help, NOVA Trainer, Leaderboard, Common Mistakes, Selector Breaking News",
            },
            unit_amount: unitAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/payment-cancel`,
      metadata: { billing, email },
    });

    logger.info(`[Stripe] Checkout session created — ${email} — $${unitAmount / 100}/${interval}`);
    res.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[Stripe] createCheckout error");
    res.status(500).json({ error: msg });
  }
});

export default router;
