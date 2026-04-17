import { Router } from "express";
import QRCode from "qrcode";
import { logger } from "../lib/logger";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router = Router();

// Build a base64-encoded RFC 2822 email message for Gmail API
function buildRawMessage({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): string {
  const boundary = `----=_Part_${Date.now()}`;
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    `You've been invited to PickSmart NOVA. Open the link to accept.`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    html,
    ``,
    `--${boundary}--`,
  ];
  const raw = lines.join("\r\n");
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

router.post("/invites/send", async (req, res) => {
  const { email, name, role, inviteUrl } = req.body as {
    email: string;
    name: string;
    role: string;
    inviteUrl: string;
  };

  if (!email || !name || !role || !inviteUrl) {
    res.status(400).json({ error: "Missing required fields: email, name, role, inviteUrl" });
    return;
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(inviteUrl, {
      width: 200,
      margin: 2,
      color: { dark: "#0d1118", light: "#ffffff" },
    });

    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    const appUrl = process.env.APP_URL ?? "https://nova-warehouse-control.replit.app";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to PickSmart NOVA</title>
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 580px; margin: 32px auto; background: #0d1118; border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #141a26 0%, #1a2035 100%); padding: 40px 40px 32px; text-align: center; border-bottom: 1px solid #252d3d; }
    .logo-circle { width: 72px; height: 72px; background: #7c3aed; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .logo-letter { font-size: 36px; font-weight: 900; color: #fff; line-height: 1; }
    .brand { font-size: 22px; font-weight: 700; color: #e5e9ef; letter-spacing: 0.5px; margin: 0; }
    .brand span { color: #f5c200; }
    .body { padding: 36px 40px; }
    h1 { color: #e5e9ef; font-size: 24px; font-weight: 800; margin: 0 0 12px; }
    p { color: #7d8fa0; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
    .role-badge { display: inline-block; background: rgba(245,194,0,0.12); border: 1px solid rgba(245,194,0,0.3); color: #f5c200; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; }
    .cta-btn { display: block; background: #f5c200; color: #0d1118; text-decoration: none; font-size: 16px; font-weight: 800; text-align: center; padding: 16px 32px; border-radius: 14px; margin: 28px 0; }
    .divider { border: none; border-top: 1px solid #252d3d; margin: 28px 0; }
    .qr-section { text-align: center; margin: 24px 0; }
    .qr-section p { font-size: 13px; color: #7d8fa0; margin-bottom: 14px; }
    .qr-img { border-radius: 12px; border: 1px solid #252d3d; max-width: 200px; }
    .link-box { background: #141a26; border: 1px solid #252d3d; border-radius: 10px; padding: 12px 16px; word-break: break-all; font-size: 12px; color: #7d8fa0; font-family: monospace; }
    .footer { background: #141a26; padding: 24px 40px; text-align: center; border-top: 1px solid #252d3d; }
    .footer p { font-size: 12px; color: #4a5568; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-circle"><span class="logo-letter">N</span></div>
      <p class="brand">PickSmart <span>NOVA</span></p>
    </div>
    <div class="body">
      <h1>You've been invited, ${name}!</h1>
      <p>You've been added to the PickSmart NOVA warehouse training platform as a <span class="role-badge">${roleLabel}</span></p>
      <p>Click the button below to create your account and get started with ES3 voice-directed picking training.</p>
      <a href="${inviteUrl}" class="cta-btn">Create My Account →</a>
      <hr class="divider" />
      <div class="qr-section">
        <p>Or scan this QR code with your phone to open on mobile:</p>
        <img src="${qrDataUrl}" alt="Invite QR Code" width="200" height="200" class="qr-img" />
      </div>
      <hr class="divider" />
      <p style="font-size:13px;">If the button doesn't work, copy and paste this link:</p>
      <div class="link-box">${inviteUrl}</div>
    </div>
    <div class="footer">
      <p>PickSmart Academy + NOVA &nbsp;·&nbsp; Warehouse Voice Training Platform</p>
      <p style="margin-top:4px;"><a href="${appUrl}" style="color:#f5c200;text-decoration:none;">${appUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

    const connectors = new ReplitConnectors();

    // Use the Gmail connector (Google-mail integration via Replit)
    const raw = buildRawMessage({
      to: email,
      subject: `You've been invited to PickSmart NOVA as ${roleLabel}`,
      html,
    });

    const gmailRes = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      logger.error({ status: gmailRes.status, errText }, "Gmail send failed");
      res.status(500).json({ error: "Failed to send email", detail: errText });
      return;
    }

    const data = await gmailRes.json();
    logger.info({ email, role, id: data.id }, "Invite email sent via Gmail");
    res.json({ ok: true, emailId: data.id });
  } catch (err) {
    logger.error({ err }, "Failed to send invite email");
    res.status(500).json({ error: "Failed to send email", detail: String(err) });
  }
});

export default router;
