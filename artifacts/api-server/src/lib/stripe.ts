import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.warn("[Stripe] STRIPE_SECRET_KEY is not set — Stripe routes will return errors.");
}

export const stripe = key
  ? new Stripe(key)
  : null;
