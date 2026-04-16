import type { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { logger } from "../lib/logger.js";

// ─── Allowed origins ──────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://picksmartacademy.net",
  "https://www.picksmartacademy.net",
  "https://nova-warehouse-control.replit.app",
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /\.spock\.replit\.dev$/,
  /\.expo\.dev$/,
];

export function corsOptions() {
  return {
    origin(
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      // Allow server-to-server requests (no origin header) and same-origin
      if (!origin) { callback(null, true); return; }

      const allowed = ALLOWED_ORIGINS.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin),
      );

      if (allowed) {
        callback(null, true);
      } else {
        // In development, allow any origin so the Replit preview always works
        if (process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          logger.warn({ origin }, "[Security] Blocked CORS origin");
          callback(new Error("Not allowed by CORS"), false);
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
  };
}

// ─── General API rate limit: 300 req / 1 min per IP ──────────────────────────
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — slow down and try again shortly." },
  handler(req, res, _next, options) {
    logger.warn({ ip: req.ip, path: req.path }, "[RateLimit] General limit hit");
    res.status(options.statusCode).json(options.message);
  },
});

// ─── Strict limit for auth endpoints: 15 req / 15 min per IP ─────────────────
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts — wait 15 minutes and try again." },
  handler(req, res, _next, options) {
    logger.warn({ ip: req.ip }, "[RateLimit] Auth limit hit — possible brute-force");
    res.status(options.statusCode).json(options.message);
  },
});

// ─── Invite / signup endpoints: 20 req / 1 hour per IP ───────────────────────
export const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many signup attempts — try again later." },
});

// ─── Brute-force tracker (in-memory, per IP + username) ──────────────────────
const failMap = new Map<string, { count: number; firstAt: number; lockedUntil?: number }>();
const MAX_FAILS       = 6;
const WINDOW_MS       = 10 * 60 * 1000;  // 10 min window
const LOCKOUT_MS      = 20 * 60 * 1000;  // 20 min lockout

// Clean old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of failMap.entries()) {
    if (now - entry.firstAt > WINDOW_MS && !(entry.lockedUntil && entry.lockedUntil > now)) {
      failMap.delete(key);
    }
  }
}, 30 * 60 * 1000);

export function recordLoginFail(ip: string, username: string): { locked: boolean; remaining: number } {
  const key = `${ip}:${username.toLowerCase()}`;
  const now = Date.now();
  const entry = failMap.get(key) ?? { count: 0, firstAt: now };

  // Reset window if old
  if (now - entry.firstAt > WINDOW_MS && !entry.lockedUntil) {
    entry.count = 0;
    entry.firstAt = now;
  }

  entry.count += 1;

  if (entry.count >= MAX_FAILS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    failMap.set(key, entry);
    logger.warn({ ip, username }, "[Security] Account locked after repeated failures");
    return { locked: true, remaining: 0 };
  }

  failMap.set(key, entry);
  return { locked: false, remaining: MAX_FAILS - entry.count };
}

export function isLoginLocked(ip: string, username: string): boolean {
  const key = `${ip}:${username.toLowerCase()}`;
  const entry = failMap.get(key);
  if (!entry?.lockedUntil) return false;
  if (Date.now() > entry.lockedUntil) {
    failMap.delete(key);
    return false;
  }
  return true;
}

export function clearLoginFails(ip: string, username: string): void {
  const key = `${ip}:${username.toLowerCase()}`;
  failMap.delete(key);
}

// ─── Bot / suspicious request detector ───────────────────────────────────────
const BOT_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nessus/i, /nmap/i,
  /masscan/i, /zgrab/i, /scrapy/i, /python-requests/i,
  /curl\/[0-9]/i, /wget\//i, /go-http-client/i,
  /libwww-perl/i, /jakarta/i, /okhttp/i,
];

export function botDetector(req: Request, res: Response, next: NextFunction): void {
  const ua = req.headers["user-agent"] ?? "";

  // Block known attack/scanner user-agents
  if (BOT_UA_PATTERNS.some((p) => p.test(ua))) {
    logger.warn({ ip: req.ip, ua, path: req.path }, "[Security] Blocked bot/scanner UA");
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Block requests probing for common exploit paths
  const path = req.path.toLowerCase();
  const PROBE_PATHS = [
    "/.env", "/wp-admin", "/wp-login", "/.git", "/phpmyadmin",
    "/admin.php", "/xmlrpc.php", "/actuator", "/.aws", "/config.json",
    "/etc/passwd", "/shell", "/.bash", "/console", "/manager/html",
  ];
  if (PROBE_PATHS.some((p) => path.startsWith(p) || path.includes(p))) {
    logger.warn({ ip: req.ip, path: req.path }, "[Security] Blocked probe path");
    res.status(404).json({ error: "Not found" });
    return;
  }

  next();
}

// ─── Sanitize inputs — strip null bytes & oversized strings ──────────────────
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body as Record<string, unknown>);
  }
  next();
}

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      // Remove null bytes and limit string field size to 10 000 chars
      obj[key] = val.replace(/\0/g, "").slice(0, 10_000);
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      sanitizeObject(val as Record<string, unknown>);
    }
  }
}
