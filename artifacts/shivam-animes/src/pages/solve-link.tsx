import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useListSolveLinks, getListSolveLinksQueryKey } from "@workspace/api-client-react";
import { ExternalLink, Globe, TrendingUp, Clock } from "lucide-react";

export default function SolveLinkPage() {
  const [country, setCountry] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const { data, isLoading } = useListSolveLinks({ query: { queryKey: getListSolveLinksQueryKey() } });

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(d => setCountry(d.country_code || ""))
      .catch(() => setCountry(""))
      .finally(() => setGeoLoading(false));
  }, []);

  const isBlocked = country === "IN";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={24} className="text-cyan-400" />
          <h1 className="text-3xl font-black text-white">Solve Links</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">Unlock content through monetized links.</p>

        {geoLoading ? (
          <div className="glass-panel rounded-xl p-12 text-center border border-white/5">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground text-sm mt-3">Detecting your region...</p>
          </div>
        ) : isBlocked ? (
          <div className="glass-panel rounded-xl p-12 text-center border border-red-500/20">
            <Globe size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Region Not Available</h2>
            <p className="text-muted-foreground">Solve Link is not available in your region.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : !data?.length ? (
          <div className="glass-panel rounded-xl p-12 text-center border border-white/5">
            <p className="text-muted-foreground">No solve links available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel rounded-xl p-5 border border-white/5 hover:border-cyan-500/30 transition-all group cursor-pointer"
                data-testid={`solve-link-${link.id}`}
              >
                <div className="flex items-start gap-4">
                  {link.imageUrl && (
                    <img src={link.imageUrl} alt={link.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">{link.title}</h3>
                    {link.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{link.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp size={11} /> {link.clickCount} clicks
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={11} /> {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
