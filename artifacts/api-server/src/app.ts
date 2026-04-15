import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./lib/webhookHandlers.js";
import { db } from "@workspace/db";
import { contractsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Stripe webhook MUST receive the raw body BEFORE express.json() runs
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);

      // Also parse the event to handle contract activation
      try {
        const rawBody = req.body as Buffer;
        const eventStr = rawBody.toString("utf8");
        const event = JSON.parse(eventStr) as { type: string; data: { object: Record<string, unknown> } };

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as {
            metadata?: Record<string, string>;
            customer?: string;
            subscription?: string;
          };
          const meta = session.metadata ?? {};
          if (meta.type === "contract" && meta.contract_id) {
            await db
              .update(contractsTable)
              .set({
                status:               "active",
                stripeCustomerId:     (session.customer as string) ?? null,
                stripeSubscriptionId: (session.subscription as string) ?? null,
              })
              .where(eq(contractsTable.id, meta.contract_id));
            logger.info(`[Contracts] Activated contract ${meta.contract_id} — ${meta.company_name}`);
          }
        }

        if (event.type === "customer.subscription.updated") {
          const sub = event.data.object as { id?: string; status?: string; pause_collection?: unknown };
          if (sub.id) {
            let newStatus: string | null = null;
            if (sub.status === "active" && !sub.pause_collection) newStatus = "active";
            else if (sub.status === "active" && sub.pause_collection) newStatus = "paused";
            else if (sub.status === "canceled") newStatus = "canceled";
            else if (sub.status === "past_due") newStatus = "past_due";

            if (newStatus) {
              await db
                .update(contractsTable)
                .set({ status: newStatus })
                .where(eq(contractsTable.stripeSubscriptionId, sub.id));
              logger.info(`[Contracts] Sub ${sub.id} → status "${newStatus}"`);
            }
          }
        }

        if (event.type === "customer.subscription.deleted") {
          const sub = event.data.object as { id?: string };
          if (sub.id) {
            await db
              .update(contractsTable)
              .set({ status: "canceled" })
              .where(eq(contractsTable.stripeSubscriptionId, sub.id));
            logger.info(`[Contracts] Canceled contract for sub ${sub.id}`);
          }
        }
      } catch (_parseErr) {
        // Non-fatal: stripe-replit-sync already handled the main event
      }

      res.status(200).json({ received: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Webhook error";
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: msg });
    }
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
