import { Router } from "express";
import { db } from "@workspace/db";
import { psaUsers } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, signToken, nextAccountNumber } from "../lib/psaAuth.js";
import { logger } from "../lib/logger.js";

const router = Router();

function safeUser(u: typeof psaUsers.$inferSelect) {
  const { passwordHash: _, ...safe } = u as any;
  return safe;
}

// ── POST /api/auth/trial ──────────────────────────────────────────────────────
// Public — no auth required. Creates a company trial account (30 days).
router.post("/auth/trial", async (req, res) => {
  const { username, password, fullName, email, companyName } = req.body as {
    username?: string;
    password?: string;
    fullName?: string;
    email?: string;
    companyName?: string;
  };

  if (!username || !password || !fullName || !email || !companyName) {
    res.status(400).json({
      error: "username, password, fullName, email, and companyName are required",
    });
    return;
  }

  if (username.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    res.status(400).json({ error: "Username must be 3+ alphanumeric characters or underscores" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  try {
    // Check username uniqueness
    const existing = await db
      .select({ id: psaUsers.id })
      .from(psaUsers)
      .where(eq(psaUsers.username, username.trim()))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    // Check email uniqueness
    if (email) {
      const emailTaken = await db
        .select({ id: psaUsers.id })
        .from(psaUsers)
        .where(eq(psaUsers.email, email.trim()))
        .limit(1);
      if (emailTaken.length > 0) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
    }

    const passwordHash = await hashPassword(password);
    const accountNumber = await nextAccountNumber();

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const [user] = await db
      .insert(psaUsers)
      .values({
        username: username.trim(),
        passwordHash,
        fullName: fullName.trim(),
        email: email.trim(),
        role: "trainer",
        status: "active",
        subscriptionPlan: "company",
        isSubscribed: true,
        accountNumber,
        companyName: companyName.trim(),
        trialEndsAt,
      })
      .returning();

    const token = await signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
      accountNumber: user.accountNumber,
    });

    logger.info({ username: user.username, accountNumber }, "[Trial] New trial account created");

    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    logger.error({ err }, "[Trial] Signup error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
