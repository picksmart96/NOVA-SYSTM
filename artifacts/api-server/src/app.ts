import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./lib/webhookHandlers.js";
import { db } from "@workspace/db";
import { contractsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  corsOptions,
  generalRateLimit,
  botDetector,
  sanitizeBody,
} from "./middleware/security.js";

const app: Express = express();

// ── Trust Replit's proxy so req.ip reflects the real client IP ────────────────
app.set("trust proxy", 1);

// ── Request logging ───────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(
  helmet({
    // Prevent browsers from MIME-sniffing responses
    noSniff: true,
    // Prevent clickjacking
    frameguard: { action: "deny" },
    // Force HTTPS for 1 year
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    // Hide server fingerprint
    hidePoweredBy: true,
    // Block dangerous cross-origin requests
    crossOriginEmbedderPolicy: false, // disabled — needed for Stripe/Expo embeds
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:"],
        frameSrc:   ["https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc:  ["'none'"],
        baseUri:    ["'self'"],
      },
    },
    // Prevent XSS attacks via referrer leakage
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

// ── CORS — locked to known domains ───────────────────────────────────────────
app.use(cors(corsOptions()));

// ── Bot / probe detector ──────────────────────────────────────────────────────
app.use(botDetector);

// ── General API rate limit (300 req / min per IP) ────────────────────────────
app.use("/api", generalRateLimit);

// ── Stripe webhook — raw body BEFORE express.json() ──────────────────────────
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
        // Non-fatal
      }

      res.status(200).json({ received: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Webhook error";
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: msg });
    }
  },
);

// ── Body parsing — 1 MB cap prevents payload bombing ─────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Input sanitization ────────────────────────────────────────────────────────
app.use(sanitizeBody);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", router);

export default app;
