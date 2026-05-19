import { Router } from "express";
import type { IRouter } from "express";
import { User } from "../models/User";
import { Anime } from "../models/Anime";
import { WatchHistory } from "../models/WatchHistory";
import { Episode } from "../models/Episode";
import { requireAuth } from "../middlewares/auth";
import { AddFavoriteBody } from "@workspace/api-zod";
import mongoose from "mongoose";

const router: IRouter = Router();

router.get("/user/favorites", requireAuth, async (req, res): Promise<void> => {
  const user = await User.findById(req.user!.id).populate("favorites");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const favorites = (user.favorites as any[]).map((a: any) => ({
    id: String(a._id),
    title: a.title,
    description: a.description || null,
    genres: a.genres || [],
    tags: a.tags || [],
    releaseYear: a.releaseYear || null,
    bannerImage: a.bannerImage || null,
    coverImage: a.coverImage || null,
    status: a.status,
    episodeCount: 0,
    viewCount: a.viewCount || 0,
    createdAt: a.createdAt?.toISOString() || new Date().toISOString(),
  }));
  res.json(favorites);
});

router.post("/user/favorites", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await User.findByIdAndUpdate(req.user!.id, {
    $addToSet: { favorites: new mongoose.Types.ObjectId(parsed.data.animeId) },
  });
  res.json({ message: "Added to favorites" });
});

router.delete("/user/favorites/:animeId", requireAuth, async (req, res): Promise<void> => {
  const animeId = Array.isArray(req.params.animeId) ? req.params.animeId[0] : req.params.animeId;
  await User.findByIdAndUpdate(req.user!.id, {
    $pull: { favorites: new mongoose.Types.ObjectId(animeId) },
  });
  res.json({ message: "Removed from favorites" });
});

router.get("/user/history", requireAuth, async (req, res): Promise<void> => {
  const history = await WatchHistory.find({ userId: req.user!.id })
    .sort({ watchedAt: -1 })
    .limit(50)
    .populate("animeId")
    .populate("episodeId");

  res.json(
    history.map((h: any) => ({
      animeId: String(h.animeId?._id || h.animeId),
      animeTitle: h.animeId?.title || "",
      animeCover: h.animeId?.coverImage || null,
      episodeId: String(h.episodeId?._id || h.episodeId),
      episodeTitle: h.episodeId?.title || "",
      episodeNumber: h.episodeId?.episodeNumber || 0,
      watchedAt: h.watchedAt?.toISOString() || new Date().toISOString(),
    }))
  );
});

export default router;
