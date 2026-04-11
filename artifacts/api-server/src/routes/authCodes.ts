import { Router } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "../lib/logger";

const router = Router();

// In-memory code store: email → { code, expiresAt, type }
const codeStore = new Map<string, { code: string; expiresAt: number; type: string }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildCodeEmail(name: string, code: string, type: "verify" | "reset" | "username", username?: string): string {
  const appUrl = process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";
  const isVerify = type === "verify";
  const isReset = type === "reset";
  const isUsername = type === "username";

  const title = isVerify ? "Verify your email" : isReset ? "Reset your password" : "Your username";
  const bodyContent = isUsername
    ? `<p>Your PickSmart NOVA username is:</p>
       <div style="background:#141a26;border:1px solid #252d3d;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
         <span style="font-size:28px;font-weight:900;color:#f5c200;letter-spacing:2px;">${username}</span>
       </div>
       <p>Use this to sign in at <a href="${appUrl}/login" style="color:#f5c200;">${appUrl}/login</a></p>`
    : `<p>${isVerify ? "Use this code to verify your email and activate your account:" : "Use this code to reset your password:"}</p>
       <div style="background:#141a26;border:1px solid #252d3d;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
         <span style="font-size:40px;font-weight:900;color:#f5c200;letter-spacing:8px;">${code}</span>
       </div>
       <p style="font-size:13px;color:#7d8fa0;">This code expires in <strong style="color:#e5e9ef;">10 minutes</strong>. Do not share it with anyone.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — PickSmart NOVA</title>
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #0d1118; border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg,#141a26,#1a2035); padding: 36px 40px 28px; text-align: center; border-bottom: 1px solid #252d3d; }
    .logo { width: 64px; height: 64px; background: #7c3aed; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; }
    .logo-letter { font-size: 32px; font-weight: 900; color: #fff; }
    .brand { font-size: 20px; font-weight: 700; color: #e5e9ef; margin: 0; }
    .brand span { color: #f5c200; }
    .body { padding: 32px 40px; }
    h1 { color: #e5e9ef; font-size: 22px; font-weight: 800; margin: 0 0 10px; }
    p { color: #7d8fa0; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
    .footer { background: #141a26; padding: 20px 40px; text-align: center; border-top: 1px solid #252d3d; }
    .footer p { font-size: 11px; color: #4a5568; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo"><span class="logo-letter">N</span></div>
      <p class="brand">PickSmart <span>NOVA</span></p>
    </div>
    <div class="body">
      <h1>${title}</h1>
      <p>Hi ${name},</p>
      ${bodyContent}
    </div>
    <div class="footer">
      <p>PickSmart Academy + NOVA &nbsp;·&nbsp; Warehouse Voice Training Platform</p>
      <p style="margin-top:4px;"><a href="${appUrl}" style="color:#f5c200;text-decoration:none;">${appUrl}</a></p>
    </div>
  </div>
</body>
</html>`;
}

function buildRawMessage({ to, from, subject, html }: { to: string; from: string; subject: string; html: string }): string {
  const boundary = `----=_Part_${Date.now()}`;
  const lines = [
    `From: ${from}`, `To: ${to}`, `Subject: ${subject}`,
    `MIME-Version: 1.0`, `Content-Type: multipart/alternative; boundary="${boundary}"`, ``,
    `--${boundary}`, `Content-Type: text/plain; charset="UTF-8"`, ``,
    `Your PickSmart NOVA verification code is inside this email.`, ``,
    `--${boundary}`, `Content-Type: text/html; charset="UTF-8"`, ``,
    html, ``, `--${boundary}--`,
  ];
  return Buffer.from(lines.join("\r\n")).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// POST /api/auth/send-code — send a verification or reset code
router.post("/auth/send-code", async (req, res) => {
  const { email, name = "there", type = "verify" } = req.body as { email: string; name?: string; type?: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  const code = generateCode();
  codeStore.set(email.toLowerCase(), { code, expiresAt: Date.now() + 10 * 60 * 1000, type });

  const subjects: Record<string, string> = {
    verify: "Your PickSmart NOVA verification code",
    reset: "Reset your PickSmart NOVA password",
    username: "Your PickSmart NOVA username",
  };

  try {
    const connectors = new ReplitConnectors();
    const html = buildCodeEmail(name, code, type as "verify" | "reset" | "username");
    const raw = buildRawMessage({
      from: "PickSmart NOVA <picksmart@picksmartacademy.net>",
      to: email,
      subject: subjects[type] ?? subjects.verify,
      html,
    });
    const gmailRes = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      logger.error({ status: gmailRes.status, errText }, "Gmail send failed for code");
      res.status(500).json({ error: "Failed to send email", detail: errText });
      return;
    }
    logger.info({ email, type }, "Auth code sent");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "send-code error");
    res.status(500).json({ error: "Failed to send email", detail: String(err) });
  }
});

// POST /api/auth/send-username — send username reminder (no code, no verify step)
router.post("/auth/send-username", async (req, res) => {
  const { email, name = "there", username } = req.body as { email: string; name?: string; username?: string };
  if (!email || !username) { res.status(400).json({ error: "Email and username required" }); return; }

  try {
    const connectors = new ReplitConnectors();
    const html = buildCodeEmail(name, "", "username", username);
    const raw = buildRawMessage({
      from: "PickSmart NOVA <picksmart@picksmartacademy.net>",
      to: email,
      subject: "Your PickSmart NOVA username",
      html,
    });
    const gmailRes = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    if (!gmailRes.ok) {
      const t = await gmailRes.text();
      res.status(500).json({ error: "Failed to send email", detail: t });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send email", detail: String(err) });
  }
});

// POST /api/auth/verify-code — check a code
router.post("/auth/verify-code", (req, res) => {
  const { email, code } = req.body as { email: string; code: string };
  if (!email || !code) { res.status(400).json({ error: "Email and code required" }); return; }

  const entry = codeStore.get(email.toLowerCase());
  if (!entry) { res.status(400).json({ error: "No code found for this email. Request a new one." }); return; }
  if (Date.now() > entry.expiresAt) {
    codeStore.delete(email.toLowerCase());
    res.status(400).json({ error: "Code has expired. Request a new one." });
    return;
  }
  if (entry.code !== code.trim()) { res.status(400).json({ error: "Incorrect code. Check your email and try again." }); return; }

  codeStore.delete(email.toLowerCase());
  res.json({ ok: true });
});

export default router;
