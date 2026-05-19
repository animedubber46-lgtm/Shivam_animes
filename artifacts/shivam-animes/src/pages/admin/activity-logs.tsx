import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useGetActivityLogs, getGetActivityLogsQueryKey } from "@workspace/api-client-react";
import { Activity } from "lucide-react";

const ACTIONS = ["", "login", "logout", "watch_episode", "add_favorite", "remove_favorite"];

export default function AdminActivityLogsPage() {
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetActivityLogs(
    { userId: userId || undefined, type: action || undefined, page, limit: 30 },
    { query: { queryKey: getGetActivityLogsQueryKey({ userId: userId || undefined, type: action || undefined, page, limit: 30 }) } }
  );

  const totalPages = data ? Math.ceil(data.total / 30) : 1;

  const actionColor = (a: string) => {
    if (a === "login") return "text-green-400 bg-green-500/10";
    if (a === "logout") return "text-red-400 bg-red-500/10";
    if (a === "watch_episode") return "text-purple-400 bg-purple-500/10";
    return "text-muted-foreground bg-white/5";
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Activity size={20} className="text-purple-400" />
        <div>
          <h1 className="text-2xl font-black text-white">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} records</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 p-3 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          value={userId}
          onChange={e => { setUserId(e.target.value); setPage(1); }}
          placeholder="Filter by user ID..."
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-purple-500/50"
          data-testid="input-filter-user"
        />
        <select
          value={action}
          onChange={e => { setAction(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
          data-testid="select-filter-action"
        >
          <option value="" className="bg-gray-900">All Actions</option>
          {ACTIONS.filter(a => a).map(a => <option key={a} value={a} className="bg-gray-900">{a}</option>)}
        </select>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Details</th>
                <th className="text-left px-4 py-3">IP</th>
                <th className="text-left px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[1, 2, 3, 4, 5].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : !data?.logs?.length ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No activity logs found.</td></tr>
              ) : data.logs.map((log: any, i: number) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`log-row-${i}`}>
                  <td className="px-4 py-3 text-white text-xs font-medium">{log.username || log.userId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${actionColor(log.action)}`}>{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[180px]">{log.details || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{log.ipAddress || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleString()}</td>
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
    </AdminLayout>
  );
}
