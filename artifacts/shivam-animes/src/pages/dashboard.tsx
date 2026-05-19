import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useGetWatchHistory, useGetMe, getGetMeQueryKey, getGetWatchHistoryQueryKey } from "@workspace/api-client-react";
import { Crown, Clock, Calendar, Activity } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: me } = useGetMe({ query: { enabled: !!user, queryKey: getGetMeQueryKey() } });
  const { data: history } = useGetWatchHistory({ query: { enabled: !!user, queryKey: getGetWatchHistoryQueryKey() } });

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [user, isLoading]);

  if (!user) return null;

  const premiumExpiry = me?.premiumExpiresAt ? new Date(me.premiumExpiresAt) : null;
  const daysLeft = premiumExpiry ? Math.ceil((premiumExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h1 className="text-3xl font-black text-white mb-8">My Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel rounded-xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Crown size={20} className="text-yellow-400" />
              <span className="text-sm text-muted-foreground">Premium Status</span>
            </div>
            <p className={`text-xl font-bold ${me?.isPremium ? "text-yellow-400" : "text-muted-foreground"}`}>
              {me?.isPremium ? "Active" : "Not Active"}
            </p>
            {daysLeft !== null && daysLeft > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{daysLeft} days remaining</p>
            )}
          </div>

          <div className="glass-panel rounded-xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-purple-400" />
              <span className="text-sm text-muted-foreground">Episodes Watched</span>
            </div>
            <p className="text-xl font-bold text-white">{history?.length ?? 0}</p>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={20} className="text-cyan-400" />
              <span className="text-sm text-muted-foreground">Expiry Date</span>
            </div>
            <p className="text-sm font-medium text-white">
              {premiumExpiry ? premiumExpiry.toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        {!me?.isPremium && (
          <div className="glass-panel rounded-xl p-6 border border-yellow-500/20 mb-8 text-center">
            <Crown size={32} className="text-yellow-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Upgrade to Premium</h2>
            <p className="text-sm text-muted-foreground mb-4">Get unlimited access to all anime episodes starting at ₹10.</p>
            <Link href="/premium">
              <button className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all" data-testid="btn-upgrade">Upgrade Now</button>
            </Link>
          </div>
        )}

        {/* Watch History */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-purple-400" /> Recent Activity
          </h2>
          {(history?.length ?? 0) === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground border border-white/5">
              No watch history yet. Start watching anime!
            </div>
          ) : (
            <div className="space-y-2">
              {history?.slice(0, 20).map((item, i) => (
                <Link key={i} href={`/anime/${item.animeId}`}>
                  <div className="glass-panel rounded-xl p-4 border border-white/5 flex items-center gap-4 hover:border-purple-500/20 transition-all cursor-pointer" data-testid={`history-item-${i}`}>
                    {item.animeCover ? (
                      <img src={item.animeCover} alt={item.animeTitle} className="w-10 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-14 rounded-lg bg-purple-900/30 flex items-center justify-center text-lg font-bold text-purple-300">{item.animeTitle?.[0]}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.animeTitle}</p>
                      <p className="text-xs text-muted-foreground">Episode {item.episodeNumber}: {item.episodeTitle}</p>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{new Date(item.watchedAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
