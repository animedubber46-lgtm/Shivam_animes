import { useParams, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { useGetAnime, getGetAnimeQueryKey, useAccessEpisode, useAddFavorite, useRemoveFavorite, useGetFavorites, getGetFavoritesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Heart, Crown, ChevronLeft, Calendar, Tag, Tv, Clock } from "lucide-react";
import type { Episode } from "@workspace/api-client-react";

export default function AnimeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const { user, isPremium, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: anime, isLoading } = useGetAnime(id, {
    query: { enabled: !!id, queryKey: getGetAnimeQueryKey(id) },
  });
  const { data: favorites } = useGetFavorites({ query: { enabled: !!user, queryKey: getGetFavoritesQueryKey() } });
  const accessMutation = useAccessEpisode();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const isFav = favorites?.some((f) => f.id === id);

  const handleAccess = (episodeId: string) => {
    if (!user) { setLocation("/login"); return; }
    if (!isPremium && !isAdmin) { setLocation("/premium"); return; }
    accessMutation.mutate({ episodeId }, {
      onSuccess: (data) => { window.location.href = data.redirectUrl; },
      onError: (err: any) => {
        toast({ title: "Access denied", description: err?.data?.error || "Premium required", variant: "destructive" });
      },
    });
  };

  const handleFav = () => {
    if (!user) { setLocation("/login"); return; }
    if (isFav) {
      removeFav.mutate({ animeId: id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() }) });
    } else {
      addFav.mutate({ data: { animeId: id } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() }) });
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Navbar />
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mt-16" />
    </div>
  );

  if (!anime) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 text-center text-muted-foreground">Anime not found</div>
    </div>
  );

  const episodes = (anime as any).episodes as Episode[] ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        {anime.bannerImage ? (
          <img src={anime.bannerImage} alt={anime.title} className="w-full h-full object-cover opacity-50" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-cyan-900/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white mb-6 transition-colors" data-testid="btn-back">
          <ChevronLeft size={16} /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="w-48 rounded-xl overflow-hidden shadow-2xl neon-glow">
              {anime.coverImage ? (
                <img src={anime.coverImage} alt={anime.title} className="w-full aspect-[2/3] object-cover" />
              ) : (
                <div className="w-full aspect-[2/3] bg-gradient-to-br from-purple-900/50 to-cyan-900/50 flex items-center justify-center">
                  <span className="text-5xl font-black text-white/20">{anime.title[0]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{anime.title}</h1>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${anime.status === "completed" ? "bg-cyan-500/20 text-cyan-400" : "bg-green-500/20 text-green-400"}`}>
                    {anime.status}
                  </span>
                  {anime.releaseYear && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={11} /> {anime.releaseYear}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Tv size={11} /> {anime.episodeCount} Episodes</span>
                </div>
              </div>
              <button onClick={handleFav} className={`p-2 rounded-xl transition-all ${isFav ? "text-red-400 bg-red-500/10" : "text-muted-foreground hover:text-red-400"}`} data-testid="btn-toggle-favorite">
                <Heart size={20} fill={isFav ? "currentColor" : "none"} />
              </button>
            </div>

            {anime.description && <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{anime.description}</p>}

            {(anime.genres?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {anime.genres!.map(g => (
                  <span key={g} className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full">{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Episodes */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4">Episodes</h2>
          {episodes.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground border border-white/5">
              No episodes available yet.
            </div>
          ) : !user ? (
            <div className="glass-panel rounded-xl p-8 text-center border border-white/5">
              <p className="text-muted-foreground text-sm mb-4">Login to access episodes.</p>
              <button onClick={() => setLocation("/login")} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all" data-testid="btn-login-to-watch">Login</button>
            </div>
          ) : !isPremium && !isAdmin ? (
            <div className="glass-panel rounded-xl p-8 text-center border border-yellow-500/20">
              <Crown size={36} className="text-yellow-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Premium Required</h3>
              <p className="text-muted-foreground text-sm mb-4">Upgrade to premium to access all episodes.</p>
              <button onClick={() => setLocation("/premium")} className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all" data-testid="btn-upgrade-premium">
                Upgrade Now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="glass-panel rounded-xl p-4 border border-white/5 flex items-center justify-between hover:border-purple-500/20 transition-all"
                  data-testid={`episode-${ep.id}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-sm font-bold text-purple-300">
                      {ep.episodeNumber}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{ep.title}</p>
                      {ep.description && <p className="text-xs text-muted-foreground line-clamp-1">{ep.description}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAccess(ep.id)}
                    disabled={accessMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-all neon-glow"
                    data-testid={`btn-watch-${ep.id}`}
                  >
                    <Play size={14} /> Watch
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
