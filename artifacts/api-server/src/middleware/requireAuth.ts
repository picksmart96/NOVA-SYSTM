import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/psaAuth.js";
import type { JwtPayload } from "../lib/psaAuth.js";

declare global {
  namespace Express {
    interface Request {
      psaUser?: JwtPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = header.slice(7);
  const payload = await verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.psaUser = payload;
  next();
}

const ROLE_RANK: Record<string, number> = {
  selector: 0,
  trainer: 1,
  supervisor: 2,
  manager: 3,
  director: 4,
  owner: 5,
};

export function requireRole(minRole: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await requireAuth(req, res, () => {
      const userRank = ROLE_RANK[req.psaUser?.role ?? ""] ?? -1;
      const minRank = ROLE_RANK[minRole] ?? 0;
      if (userRank < minRank) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
      next();
    });
  };
}
