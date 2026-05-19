import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  useListUsers, getListUsersQueryKey,
  useCreateUser, useUpdateUser, useDeleteUser, useResetUserDevice,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Crown, Smartphone, X } from "lucide-react";
import type { User } from "@workspace/api-client-react";

function UserModal({ user, onClose, onSave }: { user?: User | null; onClose: () => void; onSave: (data: any) => void }) {
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [isPremium, setIsPremium] = useState(user?.isPremium ?? false);
  const [days, setDays] = useState(30);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{user ? "Edit User" : "Create User"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" data-testid="input-new-username" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Password {user && "(leave blank to keep)"}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50" data-testid="input-new-password" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground">Premium</label>
            <button onClick={() => setIsPremium(!isPremium)} className={`w-10 h-5 rounded-full transition-all ${isPremium ? "bg-yellow-500" : "bg-white/10"}`} data-testid="toggle-premium">
              <div className={`w-4 h-4 rounded-full bg-white transition-all mx-0.5 ${isPremium ? "ml-5" : "ml-0.5"}`} />
            </button>
            {isPremium && (
              <input type="number" value={days} onChange={e => setDays(Number(e.target.value))} min={1} max={365} className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none" />
            )}
            {isPremium && <span className="text-xs text-muted-foreground">days</span>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all" data-testid="btn-cancel-user">Cancel</button>
          <button
            onClick={() => onSave({ username, password: password || undefined, isPremium, premiumDays: isPremium ? days : 0 })}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
            data-testid="btn-save-user"
          >Save</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [modal, setModal] = useState<{ open: boolean; user?: User | null }>({ open: false });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListUsers(
    { search: search || undefined, page, limit: 20 },
    { query: { queryKey: getListUsersQueryKey({ search: search || undefined, page, limit: 20 }) } }
  );
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetDevice = useResetUserDevice();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["listUsers"] });

  const handleSave = (formData: any) => {
    const u = modal.user;
    if (u) {
      updateUser.mutate(
        { id: u.id, data: formData },
        { onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "User updated" }); }, onError: (err: any) => toast({ title: "Error", description: err?.data?.error, variant: "destructive" }) }
      );
    } else {
      createUser.mutate(
        { data: formData },
        { onSuccess: () => { invalidate(); setModal({ open: false }); toast({ title: "User created" }); }, onError: (err: any) => toast({ title: "Error", description: err?.data?.error, variant: "destructive" }) }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this user?")) return;
    deleteUser.mutate({ id }, { onSuccess: () => { invalidate(); toast({ title: "User deleted" }); } });
  };

  const handleResetDevice = (id: string) => {
    resetDevice.mutate({ id }, { onSuccess: () => { invalidate(); toast({ title: "Device reset" }); } });
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Users</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} total users</p>
        </div>
        <button onClick={() => setModal({ open: true, user: null })} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-all" data-testid="btn-create-user">
          <Plus size={15} /> Create User
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="p-3 border-b border-white/5">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by username..."
            className="w-full sm:w-64 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-purple-500/50"
            data-testid="input-search-users"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Premium</th>
                <th className="text-left px-4 py-3">Expires</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : data?.users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`user-row-${user.id}`}>
                      <td className="px-4 py-3 font-medium text-white">{user.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${user.role === "admin" ? "bg-purple-600/20 text-purple-300" : "bg-white/5 text-muted-foreground"}`}>{user.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 w-fit ${user.isPremium ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-muted-foreground"}`}>
                          <Crown size={10} /> {user.isPremium ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{user.premiumExpiresAt ? new Date(user.premiumExpiresAt).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleResetDevice(user.id)} title="Reset device" className="p-1.5 text-muted-foreground hover:text-cyan-400 transition-colors" data-testid={`btn-reset-device-${user.id}`}><Smartphone size={14} /></button>
                          <button onClick={() => setModal({ open: true, user })} title="Edit" className="p-1.5 text-muted-foreground hover:text-purple-400 transition-colors" data-testid={`btn-edit-user-${user.id}`}><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(user.id)} title="Delete" className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors" data-testid={`btn-delete-user-${user.id}`}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-white/5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-xs transition-all" data-testid="btn-prev-users">Prev</button>
            <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-xs transition-all" data-testid="btn-next-users">Next</button>
          </div>
        )}
      </div>

      {modal.open && <UserModal user={modal.user} onClose={() => setModal({ open: false })} onSave={handleSave} />}
    </AdminLayout>
  );
}
