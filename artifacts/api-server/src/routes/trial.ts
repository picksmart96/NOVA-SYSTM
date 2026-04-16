import { Router } from "express";
import { db } from "@workspace/db";
import { psaUsers } from "@workspace/db";
import { eq, isNotNull, desc } from "drizzle-orm";
import { hashPassword, signToken, nextAccountNumber } from "../lib/psaAuth.js";
import { logger } from "../lib/logger.js";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

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

// ── GET /api/trial/signups ────────────────────────────────────────────────────
// Owner only. Returns all accounts that have a trialEndsAt set, newest first.
router.get("/trial/signups", requireAuth, requireRole("owner"), async (_req, res) => {
  try {
    const trials = await db
      .select({
        id:               psaUsers.id,
        username:         psaUsers.username,
        fullName:         psaUsers.fullName,
        email:            psaUsers.email,
        companyName:      psaUsers.companyName,
        isSubscribed:     psaUsers.isSubscribed,
        subscriptionPlan: psaUsers.subscriptionPlan,
        trialEndsAt:      psaUsers.trialEndsAt,
        createdAt:        psaUsers.createdAt,
        status:           psaUsers.status,
      })
      .from(psaUsers)
      .where(isNotNull(psaUsers.trialEndsAt))
      .orderBy(desc(psaUsers.createdAt));

    res.json({ signups: trials });
  } catch (err) {
    logger.error({ err }, "[Trial] signups fetch error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/trial/send-link ─────────────────────────────────────────────────
// Sends a branded trial signup email to a prospective company.
router.post("/trial/send-link", async (req, res) => {
  const { companyName, contactName, email, senderName } = req.body as {
    companyName?: string;
    contactName?: string;
    email?: string;
    senderName?: string;
  };

  if (!email || !companyName) {
    res.status(400).json({ error: "email and companyName are required" });
    return;
  }

  const appUrl = process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";
  const trialUrl = `${appUrl}/trial`;
  const greeting = contactName ? contactName : "there";
  const from = senderName ? `${senderName} via PickSmart NOVA` : "PickSmart NOVA";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin:0; padding:0; background:#0a0f1e; font-family:'Segoe UI',Arial,sans-serif; color:#e2e8f0; }
  .wrap { max-width:560px; margin:40px auto; background:#0f172a; border:1px solid #1e293b; border-radius:20px; overflow:hidden; }
  .header { background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%); padding:36px 40px 28px; border-bottom:1px solid #1e293b; }
  .logo-row { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
  .logo-icon { background:#facc15; border-radius:10px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:18px; color:#0a0f1e; flex-shrink:0; }
  .brand { font-size:18px; font-weight:900; color:#fff; letter-spacing:-0.5px; }
  .brand span { color:#facc15; }
  h1 { margin:0; font-size:26px; font-weight:900; color:#fff; line-height:1.2; }
  h1 span { color:#facc15; }
  .body { padding:32px 40px; }
  p { color:#94a3b8; font-size:15px; line-height:1.7; margin:0 0 16px; }
  .highlight { color:#e2e8f0; }
  .cta-btn { display:inline-block; background:#facc15; color:#0a0f1e; font-weight:900; font-size:16px; text-decoration:none; padding:16px 36px; border-radius:12px; margin:8px 0 24px; letter-spacing:0.3px; }
  .features { background:#0a0f1e; border:1px solid #1e293b; border-radius:12px; padding:20px 24px; margin:0 0 24px; }
  .feature { display:flex; align-items:center; gap:10px; padding:6px 0; font-size:14px; color:#cbd5e1; }
  .dot { width:8px; height:8px; background:#facc15; border-radius:50%; flex-shrink:0; }
  .link-box { background:#0a0f1e; border:1px solid #1e293b; border-radius:8px; padding:12px 16px; font-family:monospace; font-size:13px; color:#facc15; word-break:break-all; margin-bottom:16px; }
  .divider { border:none; border-top:1px solid #1e293b; margin:24px 0; }
  .footer { background:#0a0f1e; border-top:1px solid #1e293b; padding:20px 40px; text-align:center; font-size:12px; color:#475569; }
  .footer a { color:#facc15; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo-row">
      <div class="logo-icon">N</div>
      <div class="brand">PickSmart <span>NOVA</span></div>
    </div>
    <h1>Your free trial is<br/><span>ready to activate</span></h1>
  </div>
  <div class="body">
    <p>Hi ${greeting},</p>
    <p>
      ${from} has invited <span class="highlight">${companyName}</span> to try
      <strong style="color:#fff">PickSmart NOVA</strong> — the voice-directed warehouse training
      platform. Your team gets <strong style="color:#facc15">30 days free</strong>, no credit card needed.
    </p>
    <div class="features">
      <div class="feature"><div class="dot"></div>NOVA voice-directed picking sessions</div>
      <div class="feature"><div class="dot"></div>Real-time mistake tracking &amp; coaching</div>
      <div class="feature"><div class="dot"></div>CSV assignment upload or random generator</div>
      <div class="feature"><div class="dot"></div>Full company dashboard — trainers, supervisors, selectors</div>
      <div class="feature"><div class="dot"></div>Cancel anytime — no card required during trial</div>
    </div>
    <a href="${trialUrl}" class="cta-btn">Start Free Trial →</a>
    <hr class="divider" />
    <p style="font-size:13px;">If the button doesn't work, copy and paste this link:</p>
    <div class="link-box">${trialUrl}</div>
  </div>
  <div class="footer">
    <p>PickSmart Academy + NOVA &nbsp;·&nbsp; Warehouse Voice Training Platform</p>
    <p style="margin-top:4px;"><a href="${appUrl}">${appUrl}</a></p>
  </div>
</div>
</body>
</html>`;

  const boundary = `----=_Part_${Date.now()}`;
  const lines = [
    `From: PickSmart NOVA <picksmart@picksmartacademy.net>`,
    `To: ${email}`,
    `Subject: ${companyName} — Your 30-day free trial link is ready`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    `Hi ${greeting},\n\nYou've been invited to try PickSmart NOVA free for 30 days.\n\nStart here: ${trialUrl}\n\nNo credit card required.\n\n— PickSmart NOVA`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    html,
    ``,
    `--${boundary}--`,
  ];
  const raw = Buffer.from(lines.join("\r\n")).toString("base64url");

  try {
    const connectors = new ReplitConnectors();
    const gmailRes = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      logger.error({ status: gmailRes.status, errText }, "[Trial] Gmail send failed");
      res.status(500).json({ error: "Failed to send email", detail: errText });
      return;
    }

    const data = await gmailRes.json() as { id: string };
    logger.info({ email, companyName, id: data.id }, "[Trial] Trial link sent via Gmail");
    res.json({ ok: true, emailId: data.id });
  } catch (err) {
    logger.error({ err }, "[Trial] send-link error");
    res.status(500).json({ error: "Failed to send email", detail: String(err) });
  }
});

export default router;
