import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;
const TMDB_IMG = "https://image.tmdb.org/t/p/original";
const TMDB_IMG_BANNER = "https://image.tmdb.org/t/p/original";

interface PosterResult {
  title: string;
  posterUrl: string;
  bannerUrl?: string;
  source: "tmdb" | "mal";
  year?: number;
  overview?: string;
}

async function searchTMDB(name: string): Promise<PosterResult[]> {
  if (!TMDB_TOKEN) return [];
  const results: PosterResult[] = [];

  const [tvRes, movieRes] = await Promise.allSettled([
    fetch(
      `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(name)}&language=en-US&page=1`,
      { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, "Content-Type": "application/json" } }
    ),
    fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(name)}&language=en-US&page=1`,
      { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, "Content-Type": "application/json" } }
    ),
  ]);

  if (tvRes.status === "fulfilled" && tvRes.value.ok) {
    const data = await tvRes.value.json() as any;
    for (const item of (data.results ?? []).slice(0, 6)) {
      if (!item.poster_path) continue;
      results.push({
        title: item.name || item.title || name,
        posterUrl: `${TMDB_IMG}${item.poster_path}`,
        bannerUrl: item.backdrop_path ? `${TMDB_IMG_BANNER}${item.backdrop_path}` : undefined,
        source: "tmdb",
        year: item.first_air_date ? Number(item.first_air_date.slice(0, 4)) : undefined,
        overview: item.overview || undefined,
      });
    }
  }

  if (movieRes.status === "fulfilled" && movieRes.value.ok) {
    const data = await movieRes.value.json() as any;
    for (const item of (data.results ?? []).slice(0, 4)) {
      if (!item.poster_path) continue;
      results.push({
        title: item.title || name,
        posterUrl: `${TMDB_IMG}${item.poster_path}`,
        bannerUrl: item.backdrop_path ? `${TMDB_IMG_BANNER}${item.backdrop_path}` : undefined,
        source: "tmdb",
        year: item.release_date ? Number(item.release_date.slice(0, 4)) : undefined,
        overview: item.overview || undefined,
      });
    }
  }

  return results;
}

async function searchMAL(name: string): Promise<PosterResult[]> {
  if (!MAL_CLIENT_ID) return [];
  try {
    const res = await fetch(
      `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(name)}&fields=main_picture,title,alternative_titles,start_date,synopsis&limit=8&nsfw=false`,
      { headers: { "X-MAL-CLIENT-ID": MAL_CLIENT_ID } }
    );
    if (!res.ok) return [];
    const data = await res.json() as any;
    const results: PosterResult[] = [];
    for (const { node } of (data.data ?? [])) {
      const pic = node.main_picture;
      if (!pic?.large && !pic?.medium) continue;
      results.push({
        title: node.title || name,
        posterUrl: pic.large || pic.medium,
        source: "mal",
        year: node.start_date ? Number(node.start_date.slice(0, 4)) : undefined,
        overview: node.synopsis || undefined,
      });
    }
    return results;
  } catch {
    return [];
  }
}

router.get("/poster-search", requireAdmin, async (req, res): Promise<void> => {
  const name = String(req.query.name || "").trim();
  if (!name) {
    res.status(400).json({ error: "name query param is required" });
    return;
  }

  const [tmdbResults, malResults] = await Promise.allSettled([
    searchTMDB(name),
    searchMAL(name),
  ]);

  const results: PosterResult[] = [
    ...(malResults.status === "fulfilled" ? malResults.value : []),
    ...(tmdbResults.status === "fulfilled" ? tmdbResults.value : []),
  ];

  res.json({ results });
});

export default router;
