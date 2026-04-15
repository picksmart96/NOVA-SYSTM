import cron from "node-cron";
import { db } from "@workspace/db";
import { contractsTable } from "@workspace/db";
import { and, eq, lte, isNotNull, ne } from "drizzle-orm";
import { logger } from "./logger.js";
import { Resend } from "resend";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getEndDate(term: string): Date {
  const d = new Date();
  if (term === "1 Year")   d.setFullYear(d.getFullYear() + 1);
  else if (term === "2 Years") d.setFullYear(d.getFullYear() + 2);
  else if (term === "3 Years") d.setFullYear(d.getFullYear() + 3);
  else if (term === "5 Years") d.setFullYear(d.getFullYear() + 5);
  else if (term === "10 Years") d.setFullYear(d.getFullYear() + 10);
  else d.setFullYear(d.getFullYear() + 1); // default fallback
  return d;
}

function daysUntil(date: Date): number {
  return Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

async function sendRenewalAlert(companyName: string, email: string, endDate: Date, term: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    logger.warn("[ContractCron] RESEND_API_KEY not set — skipping email");
    return;
  }
  const resend = new Resend(resendKey);
  const days   = daysUntil(endDate);
  const endStr = endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  await resend.emails.send({
    from:    "PickSmart NOVA <noreply@picksmartacademy.net>",
    to:      email,
    subject: "Your NOVA Contract Renews in 7 Days",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#fff;padding:40px;border-radius:16px">
        <div style="text-align:center;margin-bottom:32px">
          <div style="display:inline-block;width:48px;height:48px;background:#facc15;border-radius:50%;line-height:48px;font-weight:900;font-size:20px;color:#0f172a;text-align:center">N</div>
          <h1 style="color:#facc15;margin:12px 0 4px">PickSmart NOVA</h1>
          <p style="color:#94a3b8;margin:0">Contract Renewal Notice</p>
        </div>
        <p style="color:#e2e8f0;font-size:16px">Hi <strong>${companyName}</strong>,</p>
        <p style="color:#94a3b8">Your NOVA service agreement renews in <strong style="color:#facc15">${days} days</strong>.</p>
        <div style="background:#1e293b;border-radius:12px;padding:20px;margin:24px 0">
          <p style="color:#94a3b8;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em">Contract Details</p>
          <p style="margin:4px 0;color:#fff"><strong>Term:</strong> ${term}</p>
          <p style="margin:4px 0;color:#fff"><strong>Renewal date:</strong> ${endStr}</p>
        </div>
        <p style="color:#94a3b8">No action needed — your service will continue automatically after renewal.</p>
        <p style="color:#94a3b8">To make changes or cancel, contact us at <a href="mailto:support@picksmartacademy.net" style="color:#facc15">support@picksmartacademy.net</a>.</p>
        <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0" />
        <p style="color:#475569;font-size:12px;text-align:center">PickSmart NOVA · picksmartacademy.net</p>
      </div>
    `,
  });
  logger.info(`[ContractCron] Renewal alert sent to ${email} (${companyName})`);
}

// ─── cron tasks ──────────────────────────────────────────────────────────────

export function startContractCron() {
  // Runs every day at 9:00 AM server time
  cron.schedule("0 9 * * *", async () => {
    logger.info("[ContractCron] Running daily contract check…");

    try {
      const contracts = await db
        .select()
        .from(contractsTable)
        .where(
          and(
            eq(contractsTable.status, "active"),
            isNotNull(contractsTable.endDate),
          ),
        );

      for (const c of contracts) {
        if (!c.endDate) continue;
        const endDate = new Date(c.endDate);
        const days    = daysUntil(endDate);

        // ── 7-day renewal alert ───────────────────────────────────────────
        if (days <= 7 && days >= 0 && !c.renewalAlertSent) {
          if (c.email) {
            try {
              await sendRenewalAlert(c.companyName, c.email, endDate, c.contractTerm);
            } catch (emailErr) {
              logger.error({ err: emailErr }, "[ContractCron] Email send failed");
            }
          }
          await db
            .update(contractsTable)
            .set({ renewalAlertSent: true })
            .where(eq(contractsTable.id, c.id));
        }

        // ── Auto-renew on expiry ──────────────────────────────────────────
        if (days <= 0 && c.autoRenew) {
          const newEnd = getEndDate(c.contractTerm);
          await db
            .update(contractsTable)
            .set({
              endDate:          newEnd,
              renewalAlertSent: false,
            })
            .where(eq(contractsTable.id, c.id));
          logger.info(`[ContractCron] Auto-renewed ${c.companyName} → new end ${newEnd.toISOString()}`);
        }

        // ── Mark expired if not auto-renew ────────────────────────────────
        if (days < 0 && !c.autoRenew) {
          await db
            .update(contractsTable)
            .set({ status: "expired" })
            .where(eq(contractsTable.id, c.id));
          logger.info(`[ContractCron] Marked expired: ${c.companyName}`);
        }
      }

      logger.info(`[ContractCron] Checked ${contracts.length} active contracts`);
    } catch (err) {
      logger.error({ err }, "[ContractCron] Daily check failed");
    }
  });

  logger.info("[ContractCron] Daily contract check scheduled (9:00 AM)");
}
