import { Router } from "express";
import type { IRouter } from "express";
import jwt from "jsonwebtoken";
import { Episode } from "../models/Episode";
import { Anime } from "../models/Anime";
import { WatchHistory } from "../models/WatchHistory";
import { requireAdmin, requireAuth, JWT_SECRET } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import {
  CreateEpisodeBody,
  UpdateEpisodeBody,
  ListEpisodesParams,
  CreateEpisodeParams,
  UpdateEpisodeParams,
  DeleteEpisodeParams,
  AccessEpisodeParams,
  RedirectEpisodeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/anime/:animeId/episodes", requireAuth, async (req, res): Promise<void> => {
  const animeId = Array.isArray(req.params.animeId) ? req.params.animeId[0] : req.params.animeId;
  const episodes = await Episode.find({ animeId }).sort({ order: 1, episodeNumber: 1 });
  res.json(
    episodes.map((e) => ({
      id: String(e._id),
      animeId: String(e.animeId),
      episodeNumber: e.episodeNumber,
      title: e.title,
      description: e.description || null,
      thumbnail: e.thumbnail || null,
      order: e.order,
      createdAt: e.createdAt?.toISOString() || new Date().toISOString(),
    }))
  );
});

router.post("/anime/:animeId/episodes", requireAdmin, async (req, res): Promise<void> => {
  const animeId = Array.isArray(req.params.animeId) ? req.params.animeId[0] : req.params.animeId;
  const parsed = CreateEpisodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const anime = await Anime.findById(animeId);
  if (!anime) {
    res.status(404).json({ error: "Anime not found" });
    return;
  }

  const episode = await Episode.create({ ...parsed.data, animeId });

  // Touch anime updatedAt so it rises to top of featured/recent lists
  // Auto-complete: if episode title contains "complete", also mark anime as completed
  await Anime.findByIdAndUpdate(
    animeId,
    /complete/i.test(parsed.data.title)
      ? { status: "completed", updatedAt: new Date() }
      : { updatedAt: new Date() }
  );

  res.status(201).json({
    id: String(episode._id),
    animeId: String(episode.animeId),
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    description: episode.description || null,
    thumbnail: episode.thumbnail || null,
    order: episode.order,
    createdAt: episode.createdAt?.toISOString() || new Date().toISOString(),
  });
});

router.patch("/anime/:animeId/episodes/:episodeId", requireAdmin, async (req, res): Promise<void> => {
  const episodeId = Array.isArray(req.params.episodeId) ? req.params.episodeId[0] : req.params.episodeId;
  const parsed = UpdateEpisodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const episode = await Episode.findByIdAndUpdate(episodeId, parsed.data, { new: true });
  if (!episode) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }

  // Touch anime updatedAt + auto-complete if title contains "complete"
  await Anime.findByIdAndUpdate(
    episode.animeId,
    parsed.data.title && /complete/i.test(parsed.data.title)
      ? { status: "completed", updatedAt: new Date() }
      : { updatedAt: new Date() }
  );

  res.json({
    id: String(episode._id),
    animeId: String(episode.animeId),
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    description: episode.description || null,
    thumbnail: episode.thumbnail || null,
    order: episode.order,
    createdAt: episode.createdAt?.toISOString() || new Date().toISOString(),
  });
});

router.delete("/anime/:animeId/episodes/:episodeId", requireAdmin, async (req, res): Promise<void> => {
  const episodeId = Array.isArray(req.params.episodeId) ? req.params.episodeId[0] : req.params.episodeId;
  const episode = await Episode.findByIdAndDelete(episodeId);
  if (!episode) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }
  res.json({ message: "Episode deleted" });
});

// Secure episode access — generates a signed redirect token
router.post("/episodes/:episodeId/access", requireAuth, async (req, res): Promise<void> => {
  const episodeId = Array.isArray(req.params.episodeId) ? req.params.episodeId[0] : req.params.episodeId;
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "");

  const episode = await Episode.findById(episodeId);
  if (!episode) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }

  // Generate a short-lived signed token (15 minutes)
  const redirectToken = jwt.sign(
    { episodeId, userId: req.user!.id, type: "redirect" },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  // Log access
  await logActivity({
    userId: req.user!.id,
    username: req.user!.username,
    type: "episode_access",
    description: `Accessed episode: ${episode.title}`,
    ip,
  });

  // Log watch history
  await WatchHistory.create({
    userId: req.user!.id,
    animeId: episode.animeId,
    episodeId: episode._id,
    watchedAt: new Date(),
  }).catch(() => {});

  res.json({ redirectUrl: `/api/redirect/${redirectToken}` });
});

// Redirect endpoint — validates token and redirects to actual URL
router.get("/redirect/:token", async (req, res): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { episodeId: string; userId: string; type: string };
    if (decoded.type !== "redirect") {
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    const episode = await Episode.findById(decoded.episodeId);
    if (!episode) {
      res.status(404).json({ error: "Episode not found" });
      return;
    }

    res.redirect(302, episode.destinationUrl);
  } catch {
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

export default router;
