import { Router, type Request, type Response } from "express";
import { stripe } from "../lib/stripe.js";

const router = Router();

router.post(
  "/stripe-webhook",
  (req: Request, res: Response) => {
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured." });
      return;
    }

    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.warn("[Stripe Webhook] Missing signature or webhook secret.");
      res.status(400).send("Webhook secret not configured.");
      return;
    }

    let event: ReturnType<typeof stripe.webhooks.constructEvent>;

    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[Stripe Webhook] Signature verification failed:", msg);
      res.status(400).send(`Webhook Error: ${msg}`);
      return;
    }

    console.log(`[Stripe Webhook] Event received: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as { customer_email?: string; metadata?: Record<string, string> };
      console.log("[Stripe Webhook] Payment SUCCESS — customer:", session.customer_email);
      // TODO: Mark the warehouse account as subscribed in the database
      // Example: await db.update(warehouses).set({ isSubscribed: true }).where(...)
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as { customer?: string };
      console.log("[Stripe Webhook] Subscription CANCELLED — customer:", sub.customer);
      // TODO: Deactivate the warehouse account
    }

    res.json({ received: true });
  }
);

export default router;
