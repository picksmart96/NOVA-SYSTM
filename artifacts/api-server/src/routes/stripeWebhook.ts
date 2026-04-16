import { Router, type Request, type Response } from "express";
import { stripe } from "../lib/stripe.js";
import { db } from "@workspace/db";
import { psaUsers } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

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

    logger.info(`[Stripe Webhook] Event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        customer_email?: string;
        metadata?: Record<string, string>;
        customer?: string;
        subscription?: string;
      };

      const email  = session.customer_email ?? session.metadata?.email;
      const userId = session.metadata?.userId;

      if (userId) {
        db.update(psaUsers)
          .set({ isSubscribed: true, subscriptionPlan: "company", trialEndsAt: null })
          .where(eq(psaUsers.id, userId))
          .then(() => logger.info(`[Stripe] Activated subscription for user ${userId}`))
          .catch((err) => logger.error({ err }, "[Stripe] Failed to activate subscription by userId"));
      } else if (email) {
        db.update(psaUsers)
          .set({ isSubscribed: true, subscriptionPlan: "company", trialEndsAt: null })
          .where(eq(psaUsers.email, email))
          .then(() => logger.info(`[Stripe] Activated subscription for email ${email}`))
          .catch((err) => logger.error({ err }, "[Stripe] Failed to activate subscription by email"));
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as { metadata?: Record<string, string> };
      const userId = sub.metadata?.userId;
      if (userId) {
        db.update(psaUsers)
          .set({ isSubscribed: false })
          .where(eq(psaUsers.id, userId))
          .then(() => logger.info(`[Stripe] Deactivated subscription for user ${userId}`))
          .catch((err) => logger.error({ err }, "[Stripe] Failed to deactivate subscription"));
      }
    }

    res.json({ received: true });
  }
);

export default router;
