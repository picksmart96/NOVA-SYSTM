import http from "node:http";
import app from "./app.js";
import { attachNovaRealtimeServer } from "./lib/novaRealtimeServer.js";
import { logger } from "./lib/logger.js";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./lib/stripeClient.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);

attachNovaRealtimeServer(server);

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

// Initialize Stripe in background — never blocks server startup
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;
  try {
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    const stripeSync = await getStripeSync();

    const domains = process.env.REPLIT_DOMAINS?.split(",");
    const webhookBase = domains?.[0]
      ? `https://${domains[0]}`
      : (process.env.APP_URL ?? "https://nova-warehouse-control.replit.app");

    await stripeSync.findOrCreateManagedWebhook(`${webhookBase}/api/stripe/webhook`);
    logger.info("Stripe webhook configured");

    stripeSync.syncBackfill()
      .then(() => logger.info("Stripe backfill complete"))
      .catch((e: unknown) => logger.warn({ err: e }, "Stripe backfill error"));
  } catch (e: unknown) {
    logger.warn({ err: e }, "Stripe init skipped (connector not available in this env)");
  }
}

initStripe();
