import { Router } from "express";
import { db } from "@workspace/db";
import { psaUsers, psaInvites, psaAlerts } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  signToken,
  nextAccountNumber,
} from "../lib/psaAuth.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { logger } from "../lib/logger.js";
import {
  authRateLimit,
  signupRateLimit,
  recordLoginFail,
  isLoginLocked,
  clearLoginFails,
} from "../middleware/security.js";

const router = Router();

// ── POST /api/auth/login — rate-limited + brute-force locked ──────────────────
router.post("/auth/login", authRateLimit, async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const ip = req.ip ?? "unknown";

  // Check lockout BEFORE hitting the database
  if (isLoginLocked(ip, username)) {
    logger.warn({ ip, username }, "[Auth] Login blocked — account locked");
    res.status(429).json({
      error: "Too many failed attempts. This account is locked for 20 minutes.",
    });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(psaUsers)
      .where(and(eq(psaUsers.username, username), ne(psaUsers.status, "banned")))
      .limit(1);

    if (!user) {
      // Record fail even for unknown usernames (prevents username enumeration timing attacks)
      recordLoginFail(ip, username);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      const { locked, remaining } = recordLoginFail(ip, username);
      logger.warn({ ip, username, remaining }, "[Auth] Failed login attempt");
      if (locked) {
        res.status(429).json({
          error: "Too many failed attempts. Account locked for 20 minutes.",
        });
      } else {
        res.status(401).json({
          error: `Invalid credentials. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before lockout.`,
        });
      }
      return;
    }

    if (user.status === "inactive") {
      res.status(403).json({ error: "Account deactivated" });
      return;
    }

    // Successful login — clear any recorded failures
    clearLoginFails(ip, username);

    const token = await signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
      accountNumber: user.accountNumber,
    });

    logger.info({ username, role: user.role }, "[Auth] Successful login");
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    logger.error({ err }, "[Auth] Login error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(psaUsers)
      .where(eq(psaUsers.id, req.psaUser!.sub))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: safeUser(user) });
  } catch (err) {
    logger.error({ err }, "[Auth] /me error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── PATCH /api/auth/me — update own profile preferences ──────────────────────
router.patch("/auth/me", requireAuth, async (req, res) => {
  const { voiceEnabled } = req.body as { voiceEnabled?: boolean };

  if (typeof voiceEnabled !== "boolean") {
    res.status(400).json({ error: "voiceEnabled (boolean) required" });
    return;
  }

  try {
    const [updated] = await db
      .update(psaUsers)
      .set({ voiceEnabled, updatedAt: new Date() })
      .where(eq(psaUsers.id, req.psaUser!.sub))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: safeUser(updated) });
  } catch (err) {
    logger.error({ err }, "[Auth] PATCH /me error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/auth/users ───────────────────────────────────────────────────────
router.get("/auth/users", requireRole("supervisor"), async (req, res) => {
  try {
    const users = await db.select().from(psaUsers).orderBy(psaUsers.accountNumber);
    res.json({ users: users.map(safeUser) });
  } catch (err) {
    logger.error({ err }, "[Auth] List users error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/auth/users ──────────────────────────────────────────────────────
router.post("/auth/users", requireRole("manager"), async (req, res) => {
  const { username, password, fullName, role, email, warehouseId, warehouseSlug } =
    req.body as {
      username?: string;
      password?: string;
      fullName?: string;
      role?: string;
      email?: string;
      warehouseId?: string;
      warehouseSlug?: string;
    };

  if (!username || !password || !fullName || !role) {
    res.status(400).json({ error: "username, password, fullName, role required" });
    return;
  }

  try {
    const taken = await db
      .select({ id: psaUsers.id })
      .from(psaUsers)
      .where(eq(psaUsers.username, username))
      .limit(1);

    if (taken.length > 0) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    const passwordHash = await hashPassword(password);

    let user: typeof psaUsers.$inferSelect | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const accountNumber = await nextAccountNumber();
      try {
        [user] = await db
          .insert(psaUsers)
          .values({
            username,
            passwordHash,
            fullName,
            role,
            email: email || null,
            status: "active",
            subscriptionPlan: "company",
            isSubscribed: true,
            accountNumber,
            warehouseId: warehouseId ?? null,
            warehouseSlug: warehouseSlug ?? null,
          })
          .returning();
        break;
      } catch (insertErr: any) {
        const msg = String(insertErr?.message ?? "");
        if (msg.includes("psa_users_account_number_key") && attempt < 2) continue;
        throw insertErr;
      }
    }

    if (!user) throw new Error("Failed to create user after retries");
    res.status(201).json({ user: safeUser(user) });
  } catch (err) {
    logger.error({ err }, "[Auth] Create user error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── PATCH /api/auth/users/:id ─────────────────────────────────────────────────
router.patch("/auth/users/:id", requireRole("supervisor"), async (req, res) => {
  const { id } = req.params;
  const { status, role } = req.body as { status?: string; role?: string };

  try {
    const [target] = await db
      .select()
      .from(psaUsers)
      .where(eq(psaUsers.id, id))
      .limit(1);

    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (target.isMaster) {
      res.status(403).json({ error: "Cannot modify master account" });
      return;
    }

    const updates: Partial<typeof psaUsers.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (status) updates.status = status;
    if (role) updates.role = role;

    const [updated] = await db
      .update(psaUsers)
      .set(updates)
      .where(eq(psaUsers.id, id))
      .returning();

    res.json({ user: safeUser(updated) });
  } catch (err) {
    logger.error({ err }, "[Auth] Update user error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/auth/users/:id ────────────────────────────────────────────────
router.delete("/auth/users/:id", requireRole("manager"), async (req, res) => {
  const { id } = req.params;

  try {
    const [target] = await db
      .select()
      .from(psaUsers)
      .where(eq(psaUsers.id, id))
      .limit(1);

    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (target.isMaster) {
      res.status(403).json({ error: "Cannot delete master account" });
      return;
    }

    await db.delete(psaUsers).where(eq(psaUsers.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[Auth] Delete user error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/auth/invite ─────────────────────────────────────────────────────
// Any authenticated user can create an invite (trainers invite selectors,
// supervisors invite trainers, owners/managers invite any role).
router.post("/auth/invite", requireAuth, async (req, res) => {
  const { fullName, email, role, warehouseId, warehouseSlug, inviteUrl } = req.body as {
    fullName?: string;
    email?: string;
    role?: string;
    warehouseId?: string;
    warehouseSlug?: string;
    inviteUrl?: string;
  };

  if (!role) {
    res.status(400).json({ error: "role is required" });
    return;
  }

  try {
    // Resolve the requesting user for alert metadata
    const [creator] = await db.select().from(psaUsers).where(eq(psaUsers.id, req.psaUser!.sub)).limit(1);

    const token = crypto.randomUUID() + "-" + Date.now().toString(36);
    await db.insert(psaInvites).values({
      token,
      fullName: fullName ?? "Team Member",
      email: email?.trim() || "",   // NOT NULL column — default to empty string
      role,
      warehouseId: warehouseId ?? null,
      warehouseSlug: warehouseSlug ?? creator?.warehouseSlug ?? null,
    });

    // ── Fire alert so Command Center is notified immediately ──
    const appUrl = process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";
    const builtInviteUrl = inviteUrl ?? `${appUrl}/invite/${token}`;
    await db.insert(psaAlerts).values({
      type: "invite_shared",
      message: `${creator?.fullName ?? creator?.username ?? "Someone"} generated a ${role} invite link`,
      severity: "low",
      companyId: creator?.warehouseSlug ?? null,
      userId: creator?.id ?? null,
      meta: {
        role,
        token,
        inviteUrl: builtInviteUrl,
        generatedBy: {
          id: creator?.id ?? null,
          username: creator?.username ?? null,
          fullName: creator?.fullName ?? null,
          companyName: creator?.companyName ?? null,
        },
      },
    });

    res.status(201).json({ token, inviteUrl: builtInviteUrl });
  } catch (err) {
    logger.error({ err }, "[Auth] Create invite error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/auth/invite/:token ── revoke a pending invite ─────────────────
router.delete("/auth/invite/:token", async (req, res) => {
  try {
    await db.delete(psaInvites).where(eq(psaInvites.token, req.params.token));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[Auth] Revoke invite error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/auth/invite/:token ───────────────────────────────────────────────
router.get("/auth/invite/:token", async (req, res) => {
  try {
    const [invite] = await db
      .select()
      .from(psaInvites)
      .where(eq(psaInvites.token, req.params.token))
      .limit(1);

    if (!invite) {
      res.status(404).json({ error: "Invite not found" });
      return;
    }

    res.json({
      invite: {
        fullName: invite.fullName,
        email: invite.email,
        role: invite.role,
        warehouseId: invite.warehouseId,
        warehouseSlug: invite.warehouseSlug,
        usedAt: invite.usedAt,
      },
    });
  } catch (err) {
    logger.error({ err }, "[Auth] Get invite error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/auth/invite/accept ──────────────────────────────────────────────
router.post("/auth/invite/accept", async (req, res) => {
  const { token, username, password, email: emailOverride, fullName: nameOverride } = req.body as {
    token?: string;
    username?: string;
    password?: string;
    email?: string;       // used when invite is "open" (no pre-set email)
    fullName?: string;    // used when invite is "open" (no pre-set name)
  };

  if (!token || !username || !password) {
    res.status(400).json({ error: "token, username, password required" });
    return;
  }

  try {
    const [invite] = await db
      .select()
      .from(psaInvites)
      .where(eq(psaInvites.token, token))
      .limit(1);

    if (!invite) {
      res.status(404).json({ error: "Invite not found or expired" });
      return;
    }

    if (invite.usedAt) {
      res.status(409).json({ error: "This invite link has already been used." });
      return;
    }

    const taken = await db
      .select({ id: psaUsers.id })
      .from(psaUsers)
      .where(eq(psaUsers.username, username))
      .limit(1);

    if (taken.length > 0) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    // For open invites (no pre-set email/name), use the values submitted by the user
    const effectiveEmail    = (invite.email    && invite.email.trim())    ? invite.email    : (emailOverride ?? null);
    const effectiveFullName = (invite.fullName && invite.fullName !== "Team Member") ? invite.fullName : (nameOverride ?? invite.fullName);

    const passwordHash = await hashPassword(password);

    let user: typeof psaUsers.$inferSelect | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const accountNumber = await nextAccountNumber();
      try {
        [user] = await db
          .insert(psaUsers)
          .values({
            username,
            passwordHash,
            fullName: effectiveFullName,
            email: effectiveEmail || null,
            role: invite.role,
            status: "active",
            subscriptionPlan: "company",
            isSubscribed: true,
            accountNumber,
            warehouseId: invite.warehouseId,
            warehouseSlug: invite.warehouseSlug,
          })
          .returning();
        break;
      } catch (insertErr: any) {
        const msg = String(insertErr?.message ?? "");
        if (msg.includes("psa_users_account_number_key") && attempt < 2) continue;
        throw insertErr;
      }
    }

    if (!user) throw new Error("Failed to create user after retries");

    await db
      .update(psaInvites)
      .set({ usedAt: new Date() })
      .where(eq(psaInvites.token, token));

    const jwtToken = await signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
      accountNumber: user.accountNumber,
    });

    res.status(201).json({ token: jwtToken, user: safeUser(user) });
  } catch (err) {
    logger.error({ err }, "[Auth] Accept invite error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/auth/lookup-by-email — check if a user exists by email ──────────
router.get("/auth/lookup-by-email", async (req, res) => {
  const email = (req.query.email as string)?.trim().toLowerCase();
  if (!email) { res.status(400).json({ error: "email required" }); return; }
  try {
    const [user] = await db
      .select({ id: psaUsers.id, fullName: psaUsers.fullName, username: psaUsers.username })
      .from(psaUsers)
      .where(eq(psaUsers.email, email))
      .limit(1);
    if (!user) {
      res.json({ found: false });
    } else {
      res.json({ found: true, name: user.fullName, username: user.username });
    }
  } catch (err) {
    logger.error({ err }, "[Auth] Lookup-by-email error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res) => {
  const { email, newPassword } = req.body as { email?: string; newPassword?: string };
  if (!email || !newPassword) {
    res.status(400).json({ error: "email and newPassword required" });
    return;
  }

  try {
    const [user] = await db
      .select({ id: psaUsers.id })
      .from(psaUsers)
      .where(eq(psaUsers.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.json({ ok: true });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(psaUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(psaUsers.id, user.id));

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[Auth] Reset password error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/auth/invites ─────────────────────────────────────────────────────
router.get("/auth/invites", requireRole("supervisor"), async (req, res) => {
  try {
    const invites = await db
      .select()
      .from(psaInvites)
      .orderBy(psaInvites.createdAt);
    res.json({ invites });
  } catch (err) {
    logger.error({ err }, "[Auth] List invites error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Utility ───────────────────────────────────────────────────────────────────
function safeUser(user: typeof psaUsers.$inferSelect) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export default router;
