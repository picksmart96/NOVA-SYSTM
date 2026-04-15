import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@workspace/db";
import { psaUsers, psaAccountCounter } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger.js";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "psa-dev-secret-change-in-prod"
);
const JWT_ISSUER = "picksmart-academy";
const JWT_EXPIRY = "30d";

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  accountNumber: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// ── Account number ────────────────────────────────────────────────────────────

export function formatAccountNumber(n: number): string {
  return "PSA-" + String(n).padStart(4, "0");
}

export async function nextAccountNumber(): Promise<string> {
  const rows = await db
    .update(psaAccountCounter)
    .set({ nextNumber: sql`next_number + 1` })
    .where(eq(psaAccountCounter.id, 1))
    .returning({ nextNumber: psaAccountCounter.nextNumber });

  const num = rows[0]?.nextNumber ?? 2;
  return formatAccountNumber(num - 1);
}

// ── Master account seeding ────────────────────────────────────────────────────

const MASTER_USERNAME = "draogo96";
const MASTER_PASSWORD = "Draogo1996#";
const MASTER_ACCOUNT_NUMBER = "PSA-0001";

export async function seedMasterAccount(): Promise<void> {
  try {
    const existing = await db
      .select({ id: psaUsers.id })
      .from(psaUsers)
      .where(eq(psaUsers.accountNumber, MASTER_ACCOUNT_NUMBER))
      .limit(1);

    if (existing.length > 0) return;

    const passwordHash = await hashPassword(MASTER_PASSWORD);
    await db.insert(psaUsers).values({
      username: MASTER_USERNAME,
      passwordHash,
      fullName: "soumaila ouedraogo",
      role: "owner",
      status: "active",
      subscriptionPlan: "owner",
      isSubscribed: true,
      accountNumber: MASTER_ACCOUNT_NUMBER,
      isMaster: true,
    });

    logger.info("[PSA Auth] Master account seeded (PSA-0001)");
  } catch (err) {
    logger.error({ err }, "[PSA Auth] Failed to seed master account");
  }
}
