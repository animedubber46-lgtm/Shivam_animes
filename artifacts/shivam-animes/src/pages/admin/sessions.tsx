import AdminLayout from "@/components/AdminLayout";
import { useGetActiveSessions, getGetActiveSessionsQueryKey, useDeleteSession } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Monitor, X, RefreshCw } from "lucide-react";

export default function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, refetch } = useGetActiveSessions({
    query: { queryKey: getGetActiveSessionsQueryKey() },
  });
  const killSession = useDeleteSession();

  const handleKill = (sessionId: string) => {
    if (!confirm("Force logout this session?")) return;
    killSession.mutate(
      { sessionId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetActiveSessionsQueryKey() });
          toast({ title: "Session terminated" });
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Monitor size={20} className="text-green-400" />
          <div>
            <h1 className="text-2xl font-black text-white">Live Sessions</h1>
            <p className="text-sm text-muted-foreground">{(data as any[])?.length ?? 0} active</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-all" data-testid="btn-refresh-sessions">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Device</th>
                <th className="text-left px-4 py-3">IP</th>
                <th className="text-left px-4 py-3">Started</th>
                <th className="text-left px-4 py-3">Last Active</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[1, 2, 3, 4, 5, 6].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : !(data as any[])?.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No active sessions.</td></tr>
              ) : (data as any[]).map((session: any) => (
                <tr key={session.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`session-row-${session.id}`}>
                  <td className="px-4 py-3 font-medium text-white">{session.username}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[150px]">{session.deviceInfo || session.deviceId}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{session.ipAddress || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(session.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(session.lastActiveAt ?? session.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => handleKill(session.id)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors" title="Kill session" data-testid={`btn-kill-session-${session.id}`}><X size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
