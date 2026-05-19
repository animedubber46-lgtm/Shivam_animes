import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  useListSolveLinks, getListSolveLinksQueryKey,
  useCreateSolveLink, useUpdateSolveLink, useDeleteSolveLink,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, ExternalLink, TrendingUp } from "lucide-react";
import type { SolveLink } from "@workspace/api-client-react";

function SolveLinkModal({ link, onClose, onSave }: { link?: SolveLink | null; onClose: () => void; onSave: (data: any) => void }) {
  const [title, setTitle] = useState(link?.title ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [description, setDescription] = useState(link?.description ?? "");
  const [imageUrl, setImageUrl] = useState(link?.imageUrl ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{link ? "Edit Solve Link" : "Add Solve Link"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground hover:text-white" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" data-testid="input-sl-title" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" placeholder="https://..." data-testid="input-sl-url" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none" data-testid="input-sl-description" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Image URL</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" placeholder="https://..." data-testid="input-sl-image" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all">Cancel</button>
          <button
            onClick={() => onSave({ title, url, description: description || undefined, imageUrl: imageUrl || undefined })}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
            data-testid="btn-save-sl"
          >Save</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSolveLinksPage() {
  const [modal, setModal] = useState<{ open: boolean; link?: SolveLink | null }>({ open: false });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListSolveLinks({ query: { queryKey: getListSolveLinksQueryKey() } });
  const createSL = useCreateSolveLink();
  const updateSL = useUpdateSolveLink();
  const deleteSL = useDeleteSolveLink();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListSolveLinksQueryKey() });

  const handleSave = (formData: any) => {
    const l = modal.link;
    if (l) {
      updateSL.mutate(
        { id: l.id, data: formData },
        { onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "Updated" }); } }
      );
    } else {
      createSL.mutate(
        { data: formData },
        { onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "Created" }); } }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this solve link?")) return;
    deleteSL.mutate({ id }, { onSuccess: () => { invalidate(); toast({ title: "Deleted" }); } });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Solve Links</h1>
          <p className="text-sm text-muted-foreground">{(data as SolveLink[] | undefined)?.length ?? 0} links</p>
        </div>
        <button onClick={() => setModal({ open: true, link: null })} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-all" data-testid="btn-add-sl">
          <Plus size={15} /> Add Link
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">URL</th>
                <th className="text-left px-4 py-3">Clicks</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[1, 2, 3, 4].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : !(data as SolveLink[] | undefined)?.length ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No solve links yet.</td></tr>
              ) : (data as SolveLink[]).map((link) => (
                <tr key={link.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`sl-row-${link.id}`}>
                  <td className="px-4 py-3 font-medium text-white">{link.title}</td>
                  <td className="px-4 py-3">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs truncate max-w-[200px]">
                      {link.url} <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-muted-foreground text-xs"><TrendingUp size={10} /> {link.clickCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal({ open: true, link })} className="p-1.5 text-muted-foreground hover:text-purple-400 transition-colors" data-testid={`btn-edit-sl-${link.id}`}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(link.id)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors" data-testid={`btn-delete-sl-${link.id}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && <SolveLinkModal link={modal.link} onClose={() => setModal({ open: false })} onSave={handleSave} />}
    </AdminLayout>
  );
}
