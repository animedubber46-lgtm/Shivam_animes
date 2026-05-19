import { Router } from "express";
import type { IRouter } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { signToken, requireAuth } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import { LoginBody, AdminLoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

function getIp(req: Parameters<typeof router.post>[1] extends (req: infer R, ...rest: any[]) => any ? R : never): string {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "");
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, deviceId, deviceInfo } = parsed.data;
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "");

  const user = await User.findOne({ username, role: "user" });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await logActivity({ username, type: "failed_login", ip, description: "Invalid password" });
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.isSuspended) {
    res.status(401).json({ error: "Account suspended" });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Account inactive" });
    return;
  }

  if (user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
    await User.findByIdAndUpdate(user._id, { isPremium: false });
  }

  // Device lock check
  if (deviceId && user.deviceId && user.deviceId !== deviceId) {
    res.status(401).json({ error: "Account already active on another device." });
    return;
  }

  // Create session
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const tokenPayload = { id: String(user._id), username: user.username, role: user.role, sessionId: "" };
  const session = await Session.create({
    userId: user._id,
    username: user.username,
    token: "temp",
    ip,
    deviceInfo: deviceInfo || null,
    lastActiveAt: new Date(),
    expiresAt,
  });

  tokenPayload.sessionId = String(session._id);
  const token = signToken(tokenPayload);
  await Session.findByIdAndUpdate(session._id, { token });

  if (deviceId && !user.deviceId) {
    await User.findByIdAndUpdate(user._id, { deviceId });
  }

  await User.findByIdAndUpdate(user._id, {
    lastActiveAt: new Date(),
    lastIp: ip,
    $inc: { loginCount: 1 },
  });

  await logActivity({
    userId: String(user._id),
    username: user.username,
    type: "login",
    ip,
    deviceInfo: deviceInfo || undefined,
  });

  const updatedUser = await User.findById(user._id);

  res.json({
    token,
    user: {
      id: String(updatedUser!._id),
      username: updatedUser!.username,
      role: updatedUser!.role,
      isPremium: updatedUser!.isPremium,
      premiumExpiresAt: updatedUser!.premiumExpiresAt?.toISOString() || null,
      isActive: updatedUser!.isActive,
    },
  });
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await Session.deleteOne({ token });
  }
  await logActivity({
    userId: req.user!.id,
    username: req.user!.username,
    type: "logout",
  });
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: String(user._id),
    username: user.username,
    role: user.role,
    isPremium: user.isPremium,
    premiumExpiresAt: user.premiumExpiresAt?.toISOString() || null,
    isActive: user.isActive,
  });
});

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "");

  const adminUsername = process.env.ADMIN_USERNAME || "PremiumWeb";
  const adminPassword = process.env.ADMIN_PASSWORD || "SHIVAMKIT";

  if (username !== adminUsername) {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }

  // Check if hashed or plain
  let validAdmin = false;
  let admin = await User.findOne({ username, role: "admin" });
  if (admin) {
    validAdmin = await bcrypt.compare(password, admin.password);
  } else {
    // Bootstrap: check plain credentials and create admin record
    if (password === adminPassword) {
      const hashed = await bcrypt.hash(password, 12);
      admin = await User.create({
        username,
        password: hashed,
        role: "admin",
        isActive: true,
      });
      validAdmin = true;
    }
  }

  if (!validAdmin || !admin) {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const tokenPayload = {
    id: String(admin._id),
    username: admin.username,
    role: "admin",
    sessionId: "",
  };
  const session = await Session.create({
    userId: admin._id,
    username: admin.username,
    token: "temp",
    ip,
    lastActiveAt: new Date(),
    expiresAt,
  });
  tokenPayload.sessionId = String(session._id);
  const token = signToken(tokenPayload);
  await Session.findByIdAndUpdate(session._id, { token });

  await logActivity({ userId: String(admin._id), username: admin.username, type: "admin_login", ip });

  res.json({
    token,
    user: {
      id: String(admin._id),
      username: admin.username,
      role: "admin",
      isPremium: false,
      premiumExpiresAt: null,
      isActive: true,
    },
  });
});

export default router;
