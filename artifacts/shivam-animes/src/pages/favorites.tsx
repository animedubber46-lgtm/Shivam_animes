import { useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import AnimeCard from "@/components/AnimeCard";
import { useGetFavorites, getGetFavoritesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading: favLoading } = useGetFavorites({
    query: { enabled: !!user, queryKey: getGetFavoritesQueryKey() },
  });

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [user, isLoading]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={24} className="text-red-400" fill="currentColor" />
          <h1 className="text-3xl font-black text-white">My Favorites</h1>
        </div>

        {favLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : !data?.length ? (
          <div className="glass-panel rounded-xl p-12 text-center border border-white/5">
            <Heart size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No favorites yet. Browse anime and add them to your favorites!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.map((anime) => <AnimeCard key={anime.id} anime={anime} />)}
          </div>
        )}
      </div>
    </div>
  );
}
