import { useState } from "react";
import { useParams } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import {
  useListEpisodes, getListEpisodesQueryKey,
  useGetAnime, getGetAnimeQueryKey,
  useCreateEpisode, useUpdateEpisode, useDeleteEpisode,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import type { Episode } from "@workspace/api-client-react";

function EpisodeModal({ episode, animeId, onClose, onSave }: { episode?: Episode | null; animeId: string; onClose: () => void; onSave: (data: any) => void }) {
  const [episodeNumber, setEpisodeNumber] = useState<number>(episode?.episodeNumber ?? 1);
  const [title, setTitle] = useState(episode?.title ?? "");
  const [description, setDescription] = useState(episode?.description ?? "");
  const [destinationUrl, setDestinationUrl] = useState((episode as any)?.destinationUrl ?? "");
  const [thumbnail, setThumbnail] = useState(episode?.thumbnail ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{episode ? "Edit Episode" : "Add Episode"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground hover:text-white" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Episode Number *</label>
              <input type="number" value={episodeNumber} onChange={e => setEpisodeNumber(Number(e.target.value))} min={1} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" data-testid="input-ep-number" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" data-testid="input-ep-title" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Destination URL * <span className="text-red-400 text-xs">(hidden from users — secure redirect)</span>
            </label>
            <input value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" placeholder="https://..." data-testid="input-ep-url" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none" data-testid="input-ep-description" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Thumbnail URL</label>
            <input value={thumbnail} onChange={e => setThumbnail(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" placeholder="https://..." data-testid="input-ep-thumbnail" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all" data-testid="btn-cancel-ep">Cancel</button>
          <button
            onClick={() => onSave({ animeId, episodeNumber, title, description: description || undefined, destinationUrl, thumbnail: thumbnail || undefined })}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
            data-testid="btn-save-ep"
          >Save</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEpisodesPage() {
  const params = useParams<{ id: string }>();
  const animeId = params.id;
  const [modal, setModal] = useState<{ open: boolean; episode?: Episode | null }>({ open: false });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: anime } = useGetAnime(animeId, { query: { queryKey: getGetAnimeQueryKey(animeId) } });
  const { data: episodes, isLoading } = useListEpisodes(animeId, { query: { queryKey: getListEpisodesQueryKey(animeId) } });
  const createEpisode = useCreateEpisode();
  const updateEpisode = useUpdateEpisode();
  const deleteEpisode = useDeleteEpisode();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(animeId) });

  const handleSave = (formData: any) => {
    const ep = modal.episode;
    if (ep) {
      updateEpisode.mutate(
        { animeId, episodeId: ep.id, data: formData },
        { onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "Episode updated" }); } }
      );
    } else {
      createEpisode.mutate(
        { animeId, data: formData },
        { onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "Episode added" }); } }
      );
    }
  };

  const handleDelete = (episodeId: string) => {
    if (!confirm("Delete this episode?")) return;
    deleteEpisode.mutate(
      { animeId, episodeId },
      { onSuccess: () => { invalidate(); toast({ title: "Episode deleted" }); } }
    );
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/anime">
          <button className="p-2 text-muted-foreground hover:text-white transition-colors" data-testid="btn-back-anime"><ChevronLeft size={18} /></button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">{anime?.title}</h1>
          <p className="text-sm text-muted-foreground">Manage episodes</p>
        </div>
        <button onClick={() => setModal({ open: true, episode: null })} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-all" data-testid="btn-add-episode">
          <Plus size={15} /> Add Episode
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[1, 2, 3].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : !episodes?.length ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No episodes yet. Add the first one!</td></tr>
              ) : (episodes as Episode[]).map((ep) => (
                <tr key={ep.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`ep-row-${ep.id}`}>
                  <td className="px-4 py-3">
                    <span className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-xs font-bold text-purple-300">{ep.episodeNumber}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{ep.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal({ open: true, episode: ep })} className="p-1.5 text-muted-foreground hover:text-purple-400 transition-colors" data-testid={`btn-edit-ep-${ep.id}`}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(ep.id)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors" data-testid={`btn-delete-ep-${ep.id}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && <EpisodeModal episode={modal.episode} animeId={animeId} onClose={() => setModal({ open: false })} onSave={handleSave} />}
    </AdminLayout>
  );
}
