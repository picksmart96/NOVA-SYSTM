import { Router } from "express";
import { stripe } from "../lib/stripe.js";

const router = Router();

router.post("/create-checkout", async (req, res) => {
  if (!stripe) {
    res.status(503).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to environment variables." });
    return;
  }

  const { companyName, email, weeklyRate = 1660 } = req.body as {
    companyName: string;
    email: string;
    weeklyRate?: number;
  };

  if (!companyName || !email) {
    res.status(400).json({ error: "companyName and email are required." });
    return;
  }

  const appUrl = process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `PickSmart NOVA — ${companyName}`,
              description: "Full platform access: NOVA Trainer, Trainer & Supervisor Dashboards, selector management",
            },
            unit_amount: Math.round(weeklyRate * 100),
            recurring: { interval: "week" },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment-success`,
      cancel_url:  `${appUrl}/payment-cancel`,
    });

    console.log(`[Stripe] Checkout session created for ${companyName} <${email}> — $${weeklyRate}/week`);
    res.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[Stripe] createCheckout error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

export default router;
