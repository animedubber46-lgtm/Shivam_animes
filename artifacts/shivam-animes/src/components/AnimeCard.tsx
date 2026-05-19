import { Link } from "wouter";
import { Play, Star } from "lucide-react";
import type { Anime } from "@workspace/api-client-react";

interface AnimeCardProps {
  anime: Anime;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link href={`/anime/${anime.id}`} data-testid={`card-anime-${anime.id}`}>
      <div className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:neon-glow">
        <div className="aspect-[2/3] bg-muted">
          {anime.coverImage ? (
            <img
              src={anime.coverImage}
              alt={anime.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${anime.id}/300/450`; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-cyan-900/50">
              <span className="text-4xl font-bold text-white/20">{anime.title[0]}</span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-600/80 flex items-center justify-center">
              <Play size={16} className="text-white ml-0.5" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-3">
          <h3 className="text-xs font-semibold text-white truncate">{anime.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded text-xs ${anime.status === "completed" ? "bg-cyan-500/20 text-cyan-400" : "bg-green-500/20 text-green-400"}`}>
              {anime.status}
            </span>
            <span className="text-xs text-muted-foreground">{anime.episodeCount} eps</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
