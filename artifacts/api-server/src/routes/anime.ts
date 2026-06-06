import { Router } from "express";
import type { IRouter } from "express";
import { Anime } from "../models/Anime";
import { Episode } from "../models/Episode";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import {
  CreateAnimeBody,
  UpdateAnimeBody,
  ListAnimeQueryParams,
  GetAnimeParams,
  UpdateAnimeParams,
  DeleteAnimeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toAnimeDoc(a: any, episodeCount = 0) {
  return {
    id: String(a._id),
    title: a.title,
    description: a.description || null,
    genres: a.genres || [],
    tags: a.tags || [],
    releaseYear: a.releaseYear || null,
    bannerImage: a.bannerImage || null,
    coverImage: a.coverImage || null,
    status: a.status,
    episodeCount: episodeCount || 0,
    viewCount: a.viewCount || 0,
    createdAt: a.createdAt?.toISOString() || new Date().toISOString(),
  };
}

router.get("/anime", async (req, res): Promise<void> => {
  const params = ListAnimeQueryParams.safeParse(req.query);
  const { search, genre, status, page = 1, limit = 20 } = params.success ? params.data : { search: undefined, genre: undefined, status: undefined, page: 1, limit: 20 };

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {};
  if (search) filter.title = { $regex: search, $options: "i" };
  if (genre) filter.genres = { $in: [genre] };
  if (status) filter.status = status;

  const [animeList, total] = await Promise.all([
    Anime.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
    Anime.countDocuments(filter),
  ]);

  const episodeCounts = await Episode.aggregate([
    { $match: { animeId: { $in: animeList.map((a) => a._id) } } },
    { $group: { _id: "$animeId", count: { $sum: 1 } } },
  ]);
  const countMap: Record<string, number> = {};
  for (const ec of episodeCounts) countMap[String(ec._id)] = ec.count;

  res.json({
    anime: animeList.map((a) => toAnimeDoc(a, countMap[String(a._id)] || 0)),
    total,
    page: pageNum,
    limit: limitNum,
  });
});

router.get("/anime/featured", async (_req, res): Promise<void> => {
  const anime = await Anime.find().sort({ updatedAt: -1 }).limit(8);
  const episodeCounts = await Episode.aggregate([
    { $match: { animeId: { $in: anime.map((a) => a._id) } } },
    { $group: { _id: "$animeId", count: { $sum: 1 } } },
  ]);
  const countMap: Record<string, number> = {};
  for (const ec of episodeCounts) countMap[String(ec._id)] = ec.count;
  res.json(anime.map((a) => toAnimeDoc(a, countMap[String(a._id)] || 0)));
});

router.get("/anime/recent", async (_req, res): Promise<void> => {
  const anime = await Anime.find().sort({ updatedAt: -1 }).limit(12);
  const episodeCounts = await Episode.aggregate([
    { $match: { animeId: { $in: anime.map((a) => a._id) } } },
    { $group: { _id: "$animeId", count: { $sum: 1 } } },
  ]);
  const countMap: Record<string, number> = {};
  for (const ec of episodeCounts) countMap[String(ec._id)] = ec.count;
  res.json(anime.map((a) => toAnimeDoc(a, countMap[String(a._id)] || 0)));
});

router.get("/anime/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const anime = await Anime.findById(raw);
  if (!anime) {
    res.status(404).json({ error: "Anime not found" });
    return;
  }

  await Anime.findByIdAndUpdate(raw, { $inc: { viewCount: 1 } });

  const episodes = await Episode.find({ animeId: raw }).sort({ order: 1, episodeNumber: 1 });

  res.json({
    ...toAnimeDoc(anime, episodes.length),
    episodes: episodes.map((e) => ({
      id: String(e._id),
      animeId: String(e.animeId),
      episodeNumber: e.episodeNumber,
      title: e.title,
      description: e.description || null,
      thumbnail: e.thumbnail || null,
      order: e.order,
      createdAt: e.createdAt?.toISOString() || new Date().toISOString(),
    })),
  });
});

router.post("/anime", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAnimeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status: rawStatus, ...rest } = parsed.data;
  const anime = await Anime.create({
    ...rest,
    ...(rawStatus ? { status: rawStatus as "ongoing" | "completed" } : {}),
  });
  res.status(201).json(toAnimeDoc(anime, 0));
});

router.patch("/anime/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateAnimeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const anime = await Anime.findByIdAndUpdate(raw, parsed.data, { new: true });
  if (!anime) {
    res.status(404).json({ error: "Anime not found" });
    return;
  }

  const episodeCount = await Episode.countDocuments({ animeId: raw });
  res.json(toAnimeDoc(anime, episodeCount));
});

router.delete("/anime/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const anime = await Anime.findByIdAndDelete(raw);
  if (!anime) {
    res.status(404).json({ error: "Anime not found" });
    return;
  }
  await Episode.deleteMany({ animeId: raw });
  res.json({ message: "Anime deleted" });
});

export default router;
