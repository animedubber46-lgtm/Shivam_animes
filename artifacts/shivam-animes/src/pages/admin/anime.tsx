import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import {
  useListAnime, getListAnimeQueryKey,
  useCreateAnime, useUpdateAnime, useDeleteAnime,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Film, ChevronRight, X, Search, Sparkles, Check } from "lucide-react";
import type { Anime } from "@workspace/api-client-react";

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Thriller"];

interface PosterResult {
  title: string;
  posterUrl: string;
  bannerUrl?: string;
  source: "tmdb" | "mal";
  year?: number;
  overview?: string;
}

function PosterSearchPanel({
  query,
  token,
  onSelectPoster,
  onSelectBanner,
  selectedPoster,
  selectedBanner,
}: {
  query: string;
  token: string;
  onSelectPoster: (url: string) => void;
  onSelectBanner: (url: string) => void;
  selectedPoster: string;
  selectedBanner: string;
}) {
  const [results, setResults] = useState<PosterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchName, setSearchName] = useState(query);

  const doSearch = async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/poster-search?name=${encodeURIComponent(name.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={13} className="text-purple-400" />
        <span className="text-xs font-semibold text-purple-300">Auto-fetch Poster</span>
        <span className="text-[10px] text-muted-foreground ml-1">from TMDB &amp; MyAnimeList</span>
      </div>
      <div className="flex gap-2 mb-3">
        <input
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch(searchName)}
          placeholder="Anime name to search..."
          className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 placeholder-muted-foreground"
        />
        <button
          onClick={() => doSearch(searchName)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-xs font-medium transition-all"
        >
          {loading ? (
            <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin inline-block" />
          ) : (
            <Search size={12} />
          )}
          Search
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No posters found. Try a different name.</p>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-[10px] text-muted-foreground mb-2">
            Click a poster to set as cover · Right-click a poster to set as banner
          </p>
          <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
            {results.map((r, i) => (
              <div key={i} className="relative group cursor-pointer">
                <div
                  onClick={() => onSelectPoster(r.posterUrl)}
                  onContextMenu={e => {
                    e.preventDefault();
                    if (r.bannerUrl) onSelectBanner(r.bannerUrl);
                    else onSelectBanner(r.posterUrl);
                  }}
                  className={`aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPoster === r.posterUrl
                      ? "border-purple-500 shadow-lg shadow-purple-500/30"
                      : "border-transparent hover:border-purple-500/40"
                  }`}
                >
                  <img
                    src={r.posterUrl}
                    alt={r.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedPoster === r.posterUrl && (
                    <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[9px] text-white truncate">{r.title}</p>
                  <p className="text-[8px] text-purple-300 capitalize">{r.source}{r.year ? ` · ${r.year}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
          {results.some(r => r.bannerUrl) && (
            <p className="text-[10px] text-cyan-400 mt-2">
              💡 Right-click any poster to use its banner/backdrop as the banner image
            </p>
          )}
        </>
      )}
    </div>
  );
}

function AnimeModal({ anime, onClose, onSave, token }: { anime?: Anime | null; onClose: () => void; onSave: (data: any) => void; token: string }) {
  const [title, setTitle] = useState(anime?.title ?? "");
  const [description, setDescription] = useState(anime?.description ?? "");
  const [coverImage, setCoverImage] = useState(anime?.coverImage ?? "");
  const [bannerImage, setBannerImage] = useState(anime?.bannerImage ?? "");
  const [status, setStatus] = useState<"ongoing" | "completed">((anime?.status as "ongoing" | "completed") ?? "ongoing");
  const [genres, setGenres] = useState<string[]>(anime?.genres ?? []);
  const [releaseYear, setReleaseYear] = useState<string>(anime?.releaseYear ? String(anime.releaseYear) : "");
  const [showPosterSearch, setShowPosterSearch] = useState(false);

  const toggleGenre = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 w-full max-w-xl mx-4 my-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{anime ? "Edit Anime" : "Add Anime"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground hover:text-white" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
              data-testid="input-anime-title"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
              data-testid="input-anime-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cover Image URL</label>
              <div className="flex gap-1.5">
                <input
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                  placeholder="https://..."
                  data-testid="input-anime-cover"
                />
                {coverImage && (
                  <img src={coverImage} alt="" className="w-8 h-10 rounded object-cover shrink-0 border border-white/10" />
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Banner Image URL</label>
              <div className="flex gap-1.5">
                <input
                  value={bannerImage}
                  onChange={e => setBannerImage(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                  placeholder="https://..."
                  data-testid="input-anime-banner"
                />
                {bannerImage && (
                  <img src={bannerImage} alt="" className="w-14 h-10 rounded object-cover shrink-0 border border-white/10" />
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPosterSearch(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition-all w-full justify-center"
          >
            <Sparkles size={12} />
            {showPosterSearch ? "Hide Poster Search" : "Auto-fetch Poster from TMDB & MyAnimeList"}
          </button>

          {showPosterSearch && (
            <PosterSearchPanel
              query={title}
              token={token}
              onSelectPoster={url => setCoverImage(url)}
              onSelectBanner={url => setBannerImage(url)}
              selectedPoster={coverImage}
              selectedBanner={bannerImage}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                data-testid="select-anime-status"
              >
                <option value="ongoing" className="bg-gray-900">Ongoing</option>
                <option value="completed" className="bg-gray-900">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Release Year</label>
              <input
                type="number"
                value={releaseYear}
                onChange={e => setReleaseYear(e.target.value)}
                min={1990}
                max={2030}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                data-testid="input-anime-year"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Genres</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-all ${genres.includes(g) ? "bg-purple-600/20 text-purple-300 border-purple-500/30" : "bg-white/5 text-muted-foreground border-white/10 hover:border-purple-500/20"}`}
                  data-testid={`genre-${g}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all"
            data-testid="btn-cancel-anime"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({
              title,
              description: description || undefined,
              coverImage: coverImage || undefined,
              bannerImage: bannerImage || undefined,
              status,
              genres: genres.length ? genres : undefined,
              releaseYear: releaseYear ? Number(releaseYear) : undefined,
            })}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
            data-testid="btn-save-anime"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnimePage() {
  const [modal, setModal] = useState<{ open: boolean; anime?: Anime | null }>({ open: false });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const token = typeof window !== "undefined" ? localStorage.getItem("shivam_token") ?? "" : "";

  const { data, isLoading } = useListAnime(
    { search: search || undefined, page, limit: 20 },
    { query: { queryKey: getListAnimeQueryKey({ search: search || undefined, page, limit: 20 }) } }
  );
  const createAnime = useCreateAnime();
  const updateAnime = useUpdateAnime();
  const deleteAnime = useDeleteAnime();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["listAnime"] });

  const handleSave = (formData: any) => {
    const a = modal.anime;
    if (a) {
      updateAnime.mutate(
        { id: a.id, data: formData },
        {
          onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "Anime updated" }); },
          onError: (err: any) => toast({ title: "Error", description: err?.data?.error, variant: "destructive" }),
        }
      );
    } else {
      createAnime.mutate(
        { data: formData },
        {
          onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "Anime added" }); },
          onError: (err: any) => toast({ title: "Error", description: err?.data?.error, variant: "destructive" }),
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this anime and all its episodes?")) return;
    deleteAnime.mutate({ id }, { onSuccess: () => { invalidate(); toast({ title: "Anime deleted" }); } });
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Anime CMS</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} titles</p>
        </div>
        <button
          onClick={() => setModal({ open: true, anime: null })}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-all"
          data-testid="btn-add-anime"
        >
          <Plus size={15} /> Add Anime
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="p-3 border-b border-white/5">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search anime..."
            className="w-full sm:w-64 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-purple-500/50"
            data-testid="input-search-anime"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3">Anime</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Episodes</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : data?.anime.map((anime) => (
                    <tr key={anime.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`anime-row-${anime.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {anime.coverImage ? (
                            <img src={anime.coverImage} alt={anime.title} className="w-8 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-10 rounded bg-purple-900/30 flex items-center justify-center">
                              <Film size={12} className="text-purple-400" />
                            </div>
                          )}
                          <span className="font-medium text-white truncate max-w-[200px]">{anime.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${anime.status === "completed" ? "bg-cyan-500/20 text-cyan-400" : "bg-green-500/20 text-green-400"}`}>
                          {anime.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{anime.episodeCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/anime/${anime.id}/episodes`}>
                            <button title="Manage episodes" className="p-1.5 text-muted-foreground hover:text-cyan-400 transition-colors" data-testid={`btn-episodes-${anime.id}`}>
                              <ChevronRight size={14} />
                            </button>
                          </Link>
                          <button onClick={() => setModal({ open: true, anime })} className="p-1.5 text-muted-foreground hover:text-purple-400 transition-colors" data-testid={`btn-edit-anime-${anime.id}`}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(anime.id)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors" data-testid={`btn-delete-anime-${anime.id}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-white/5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-xs transition-all">Prev</button>
            <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-xs transition-all">Next</button>
          </div>
        )}
      </div>

      {modal.open && (
        <AnimeModal
          anime={modal.anime}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
          token={token}
        />
      )}
    </AdminLayout>
  );
}
