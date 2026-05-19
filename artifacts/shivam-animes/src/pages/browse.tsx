import { useState } from "react";
import Navbar from "@/components/Navbar";
import AnimeCard from "@/components/AnimeCard";
import { useListAnime, getListAnimeQueryKey } from "@workspace/api-client-react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Thriller"];
const STATUSES = [{ value: "", label: "All" }, { value: "ongoing", label: "Ongoing" }, { value: "completed", label: "Completed" }];

export default function BrowsePage() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 24;

  const { data, isLoading } = useListAnime(
    { search: search || undefined, genre: genre || undefined, status: status || undefined, page, limit },
    { query: { queryKey: getListAnimeQueryKey({ search: search || undefined, genre: genre || undefined, status: status || undefined, page, limit }) } }
  );

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Browse Anime</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} titles available</p>
        </div>

        {/* Filters */}
        <div className="glass-panel rounded-xl p-4 border border-white/5 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search anime..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-purple-500/50 transition-all"
              data-testid="input-search"
            />
          </div>
          <select
            value={genre}
            onChange={(e) => { setGenre(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
            data-testid="select-genre"
          >
            <option value="" className="bg-gray-900">All Genres</option>
            {GENRES.map(g => <option key={g} value={g} className="bg-gray-900">{g}</option>)}
          </select>
          <div className="flex gap-2">
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => { setStatus(s.value); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${status === s.value ? "bg-purple-600 text-white" : "bg-white/5 text-muted-foreground hover:text-white"}`}
                data-testid={`btn-status-${s.value || "all"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : data?.anime.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No anime found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data?.anime.map((anime) => <AnimeCard key={anime.id} anime={anime} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-sm transition-all"
              data-testid="btn-prev-page"
            >Prev</button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-sm transition-all"
              data-testid="btn-next-page"
            >Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
