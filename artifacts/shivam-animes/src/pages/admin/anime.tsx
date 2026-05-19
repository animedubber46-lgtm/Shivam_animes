import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import {
  useListAnime, getListAnimeQueryKey,
  useCreateAnime, useUpdateAnime, useDeleteAnime,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Film, ChevronRight, X } from "lucide-react";
import type { Anime } from "@workspace/api-client-react";

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Thriller"];

function AnimeModal({ anime, onClose, onSave }: { anime?: Anime | null; onClose: () => void; onSave: (data: any) => void }) {
  const [title, setTitle] = useState(anime?.title ?? "");
  const [description, setDescription] = useState(anime?.description ?? "");
  const [coverImage, setCoverImage] = useState(anime?.coverImage ?? "");
  const [bannerImage, setBannerImage] = useState(anime?.bannerImage ?? "");
  const [status, setStatus] = useState<"ongoing" | "completed">((anime?.status as "ongoing" | "completed") ?? "ongoing");
  const [genres, setGenres] = useState<string[]>(anime?.genres ?? []);
  const [releaseYear, setReleaseYear] = useState<string>(anime?.releaseYear ? String(anime.releaseYear) : "");

  const toggleGenre = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{anime ? "Edit Anime" : "Add Anime"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground hover:text-white" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" data-testid="input-anime-title" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none" data-testid="input-anime-description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cover Image URL</label>
              <input value={coverImage} onChange={e => setCoverImage(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" placeholder="https://..." data-testid="input-anime-cover" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Banner Image URL</label>
              <input value={bannerImage} onChange={e => setBannerImage(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" placeholder="https://..." data-testid="input-anime-banner" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" data-testid="select-anime-status">
                <option value="ongoing" className="bg-gray-900">Ongoing</option>
                <option value="completed" className="bg-gray-900">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Release Year</label>
              <input type="number" value={releaseYear} onChange={e => setReleaseYear(e.target.value)} min={1990} max={2030} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" data-testid="input-anime-year" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Genres</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map(g => (
                <button key={g} onClick={() => toggleGenre(g)} className={`px-2 py-0.5 text-xs rounded-full border transition-all ${genres.includes(g) ? "bg-purple-600/20 text-purple-300 border-purple-500/30" : "bg-white/5 text-muted-foreground border-white/10 hover:border-purple-500/20"}`} data-testid={`genre-${g}`}>{g}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all" data-testid="btn-cancel-anime">Cancel</button>
          <button
            onClick={() => onSave({ title, description: description || undefined, coverImage: coverImage || undefined, bannerImage: bannerImage || undefined, status, genres: genres.length ? genres : undefined, releaseYear: releaseYear ? Number(releaseYear) : undefined })}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
            data-testid="btn-save-anime"
          >Save</button>
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
        { onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "Anime updated" }); }, onError: (err: any) => toast({ title: "Error", description: err?.data?.error, variant: "destructive" }) }
      );
    } else {
      createAnime.mutate(
        { data: formData },
        { onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "Anime added" }); }, onError: (err: any) => toast({ title: "Error", description: err?.data?.error, variant: "destructive" }) }
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
        <button onClick={() => setModal({ open: true, anime: null })} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-all" data-testid="btn-add-anime">
          <Plus size={15} /> Add Anime
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="p-3 border-b border-white/5">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search anime..." className="w-full sm:w-64 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-purple-500/50" data-testid="input-search-anime" />
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
                      {Array.from({ length: 4 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                : data?.anime.map((anime) => (
                    <tr key={anime.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`anime-row-${anime.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {anime.coverImage ? (
                            <img src={anime.coverImage} alt={anime.title} className="w-8 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-10 rounded bg-purple-900/30 flex items-center justify-center"><Film size={12} className="text-purple-400" /></div>
                          )}
                          <span className="font-medium text-white truncate max-w-[200px]">{anime.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${anime.status === "completed" ? "bg-cyan-500/20 text-cyan-400" : "bg-green-500/20 text-green-400"}`}>{anime.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{anime.episodeCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/anime/${anime.id}/episodes`}>
                            <button title="Manage episodes" className="p-1.5 text-muted-foreground hover:text-cyan-400 transition-colors" data-testid={`btn-episodes-${anime.id}`}><ChevronRight size={14} /></button>
                          </Link>
                          <button onClick={() => setModal({ open: true, anime })} className="p-1.5 text-muted-foreground hover:text-purple-400 transition-colors" data-testid={`btn-edit-anime-${anime.id}`}><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(anime.id)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors" data-testid={`btn-delete-anime-${anime.id}`}><Trash2 size={14} /></button>
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

      {modal.open && <AnimeModal anime={modal.anime} onClose={() => setModal({ open: false })} onSave={handleSave} />}
    </AdminLayout>
  );
}
