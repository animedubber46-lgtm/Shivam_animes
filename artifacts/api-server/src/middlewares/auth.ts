import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Session } from "../models/Session";
import { User } from "../models/User";
import { logger } from "../lib/logger";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & {
      sessionId: string;
    };
    const session = await Session.findById(decoded.sessionId);
    if (!session) {
      res.status(401).json({ error: "Session expired" });
      return;
    }
    await Session.findByIdAndUpdate(decoded.sessionId, {
      lastActiveAt: new Date(),
    });
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

export async function requirePremium(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = await User.findById(req.user!.id);
    if (!user || !user.isPremium) {
      res.status(403).json({ error: "Premium access required" });
      return;
    }
    if (user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
      await User.findByIdAndUpdate(user._id, { isPremium: false });
      res.status(403).json({ error: "Premium subscription expired" });
      return;
    }
    next();
  });
}

export function signToken(
  payload: AuthUser & { sessionId: string }
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export { JWT_SECRET };
