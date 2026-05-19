import { Router } from "express";
import type { IRouter } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { requireAdmin } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import {
  CreateUserBody,
  UpdateUserBody,
  GenerateUserBody,
  ListUsersQueryParams,
  GetUserParams,
  UpdateUserParams,
  DeleteUserParams,
  ResetUserDeviceParams,
  ForceLogoutUserParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toUserDoc(u: any) {
  const isPremium = u.isPremium && (!u.premiumExpiresAt || u.premiumExpiresAt > new Date());
  return {
    id: String(u._id),
    username: u.username,
    role: u.role,
    isPremium,
    premiumExpiresAt: u.premiumExpiresAt?.toISOString() || null,
    premiumDays: u.premiumDays || null,
    isActive: u.isActive,
    isSuspended: u.isSuspended,
    deviceId: u.deviceId || null,
    lastIp: u.lastIp || null,
    lastCountry: u.lastCountry || null,
    lastActiveAt: u.lastActiveAt?.toISOString() || null,
    loginCount: u.loginCount || 0,
    createdAt: u.createdAt?.toISOString() || new Date().toISOString(),
  };
}

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  const { search, status, page = 1, limit = 20 } = params.success ? params.data : { search: undefined, status: undefined, page: 1, limit: 20 };

  const filter: Record<string, any> = { role: "user" };
  if (search) {
    filter.username = { $regex: search, $options: "i" };
  }
  if (status === "premium") filter.isPremium = true;
  else if (status === "suspended") filter.isSuspended = true;
  else if (status === "active") filter.isActive = true;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.json({ users: users.map(toUserDoc), total, page: pageNum, limit: limitNum });
});

router.post("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, isPremium = false, premiumDays } = parsed.data;
  const existing = await User.findOne({ username });
  if (existing) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  let premiumExpiresAt = null;
  if (isPremium && premiumDays) {
    premiumExpiresAt = new Date(Date.now() + premiumDays * 24 * 60 * 60 * 1000);
  }

  const user = await User.create({
    username,
    password: hashed,
    role: "user",
    isPremium,
    premiumDays: premiumDays || null,
    premiumExpiresAt,
    isActive: true,
  });

  await logActivity({ userId: String(user._id), username: req.user!.username, type: "create_user", description: `Created user: ${username}` });

  res.status(201).json(toUserDoc(user));
});

router.get("/admin/users/generate", requireAdmin, async (_req, res): Promise<void> => {
  res.json({ message: "Use POST /admin/users/generate" });
});

router.post("/admin/users/generate", requireAdmin, async (req, res): Promise<void> => {
  const parsed = GenerateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { premiumDays } = parsed.data;
  const randomStr = () => Math.random().toString(36).slice(2, 10);
  const username = parsed.data.username || `user_${randomStr()}`;
  const password = parsed.data.password || randomStr() + randomStr();

  const existing = await User.findOne({ username });
  if (existing) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const premiumExpiresAt = new Date(Date.now() + premiumDays * 24 * 60 * 60 * 1000);

  const user = await User.create({
    username,
    password: hashed,
    role: "user",
    isPremium: true,
    premiumDays,
    premiumExpiresAt,
    isActive: true,
  });

  // Return with plaintext password just this once (for admin to share)
  await logActivity({ userId: String(user._id), username: req.user!.username, type: "generate_user", description: `Generated user: ${username}` });

  const doc = toUserDoc(user);
  res.status(201).json({ ...doc, plainPassword: password });
});

router.get("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = await User.findById(raw);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toUserDoc(user));
});

router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, any> = {};
  const data = parsed.data;

  if (data.isPremium !== undefined) update.isPremium = data.isPremium;
  if (data.isSuspended !== undefined) update.isSuspended = data.isSuspended;
  if (data.isActive !== undefined) update.isActive = data.isActive;
  if (data.premiumDays !== undefined) {
    update.premiumDays = data.premiumDays;
    update.premiumExpiresAt = new Date(Date.now() + data.premiumDays * 24 * 60 * 60 * 1000);
    update.isPremium = true;
  }
  if (data.premiumExpiresAt !== undefined) {
    update.premiumExpiresAt = data.premiumExpiresAt ? new Date(data.premiumExpiresAt) : null;
  }

  const user = await User.findByIdAndUpdate(raw, update, { new: true });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await logActivity({ username: req.user!.username, type: "update_user", description: `Updated user: ${user.username}` });
  res.json(toUserDoc(user));
});

router.delete("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = await User.findByIdAndDelete(raw);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await Session.deleteMany({ userId: raw });
  await logActivity({ username: req.user!.username, type: "delete_user", description: `Deleted user: ${user.username}` });
  res.json({ message: "User deleted" });
});

router.post("/admin/users/:id/reset-device", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = await User.findByIdAndUpdate(raw, { deviceId: null }, { new: true });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await logActivity({ username: req.user!.username, type: "reset_device", description: `Reset device for: ${user.username}` });
  res.json({ message: "Device lock reset" });
});

router.post("/admin/users/:id/force-logout", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = await User.findById(raw);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await Session.deleteMany({ userId: raw });
  await logActivity({ username: req.user!.username, type: "force_logout", description: `Force logged out: ${user.username}` });
  res.json({ message: "User sessions terminated" });
});

export default router;
