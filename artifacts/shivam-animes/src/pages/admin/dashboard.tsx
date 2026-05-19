import AdminLayout from "@/components/AdminLayout";
import { useGetAnalytics, getGetAnalyticsQueryKey } from "@workspace/api-client-react";
import { Users, Film, Activity, Monitor, Crown, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const { data, isLoading } = useGetAnalytics({ query: { queryKey: getGetAnalyticsQueryKey() } });

  const stats = [
    { label: "Total Users", value: data?.totalUsers ?? 0, icon: Users, color: "text-purple-400", bg: "bg-purple-600/10 border-purple-500/20" },
    { label: "Premium Users", value: data?.premiumUsers ?? 0, icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { label: "Total Anime", value: data?.totalAnime ?? 0, icon: Film, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { label: "Online Now", value: data?.onlineNow ?? 0, icon: Monitor, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: "Active Today", value: data?.activeToday ?? 0, icon: Activity, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
    { label: "Total Episodes", value: data?.totalEpisodes ?? 0, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`glass-panel rounded-xl p-4 border ${stat.bg}`} data-testid={`stat-${stat.label.toLowerCase().replace(" ", "-")}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            {isLoading ? (
              <div className="h-7 w-16 bg-white/5 rounded animate-pulse" />
            ) : (
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value.toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {data?.topAnime && data.topAnime.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Top Anime</h2>
          <div className="space-y-2">
            {data.topAnime.slice(0, 15).map((item: any, i: number) => (
              <div key={i} className="glass-panel rounded-xl p-3 border border-white/5 flex items-center gap-3 text-sm" data-testid={`activity-row-${i}`}>
                <Activity size={13} className="text-purple-400 flex-shrink-0" />
                <span className="text-white flex-1 truncate">{item.title ?? item.animeId}</span>
                <span className="text-muted-foreground text-xs flex-shrink-0">{item.viewCount ?? 0} views</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
