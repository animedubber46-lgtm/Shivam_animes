import { Router } from "express";
import type { IRouter } from "express";
import { User } from "../models/User";
import { Anime } from "../models/Anime";
import { Episode } from "../models/Episode";
import { Session } from "../models/Session";
import { ActivityLog } from "../models/ActivityLog";
import { requireAdmin } from "../middlewares/auth";
import { GetActivityLogsQueryParams, DeleteSessionParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/analytics", requireAdmin, async (_req, res): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    premiumUsers,
    activeToday,
    totalAnime,
    totalEpisodes,
    totalRedirects,
    recentSignups,
    onlineNow,
    topAnime,
    countryAgg,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "user", isPremium: true }),
    User.countDocuments({ role: "user", lastActiveAt: { $gte: todayStart } }),
    Anime.countDocuments(),
    Episode.countDocuments(),
    ActivityLog.countDocuments({ type: "episode_access" }),
    User.countDocuments({ role: "user", createdAt: { $gte: weekAgo } }),
    Session.countDocuments({ expiresAt: { $gt: now }, lastActiveAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } }),
    Anime.find().sort({ viewCount: -1 }).limit(5).select("title viewCount"),
    ActivityLog.aggregate([
      { $match: { country: { $ne: null } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.json({
    totalUsers,
    premiumUsers,
    activeToday,
    onlineNow,
    totalAnime,
    totalEpisodes,
    totalRedirects,
    recentSignups,
    topAnime: topAnime.map((a: any) => ({
      animeId: String(a._id),
      title: a.title,
      viewCount: a.viewCount || 0,
    })),
    countryBreakdown: countryAgg.map((c: any) => ({
      country: c._id,
      count: c.count,
    })),
  });
});

router.get("/admin/activity-logs", requireAdmin, async (req, res): Promise<void> => {
  const params = GetActivityLogsQueryParams.safeParse(req.query);
  const { userId, type, page = 1, limit = 50 } = params.success ? params.data : { userId: undefined, type: undefined, page: 1, limit: 50 };

  const filter: Record<string, any> = {};
  if (userId) filter.userId = userId;
  if (type) filter.type = type;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
    ActivityLog.countDocuments(filter),
  ]);

  res.json({
    logs: logs.map((l) => ({
      id: String(l._id),
      userId: l.userId ? String(l.userId) : "",
      username: l.username,
      type: l.type,
      description: l.description || null,
      ip: l.ip || null,
      country: l.country || null,
      deviceInfo: l.deviceInfo || null,
      createdAt: l.createdAt?.toISOString() || new Date().toISOString(),
    })),
    total,
    page: pageNum,
    limit: limitNum,
  });
});

router.get("/admin/sessions", requireAdmin, async (_req, res): Promise<void> => {
  const sessions = await Session.find({ expiresAt: { $gt: new Date() } })
    .sort({ lastActiveAt: -1 })
    .limit(100);

  res.json(
    sessions.map((s) => ({
      id: String(s._id),
      userId: String(s.userId),
      username: s.username,
      ip: s.ip || null,
      country: s.country || null,
      deviceInfo: s.deviceInfo || null,
      lastActiveAt: s.lastActiveAt?.toISOString() || new Date().toISOString(),
      createdAt: s.createdAt?.toISOString() || new Date().toISOString(),
    }))
  );
});

router.delete("/admin/sessions/:sessionId", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  await Session.findByIdAndDelete(raw);
  res.json({ message: "Session terminated" });
});

export default router;
