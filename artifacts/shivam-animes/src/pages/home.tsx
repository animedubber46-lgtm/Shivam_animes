import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import AnimeCard from "@/components/AnimeCard";
import { useGetFeaturedAnime, useGetRecentAnime } from "@workspace/api-client-react";
import { Crown, Play, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];
    const colors = ["#a855f7", "#06b6d4", "#7c3aed", "#0891b2"];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.6 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };
    animate();
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
}

export default function HomePage() {
  const { data: featured, isLoading: featLoading } = useGetFeaturedAnime();
  const { data: recent, isLoading: recLoading } = useGetRecentAnime();
  const { user, isPremium } = useAuth();
  const [, setLocation] = useLocation();
  const hero = featured?.[0];

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleCanvas />
      <Navbar />

      {/* Hero */}
      <div className="relative min-h-screen flex items-center pt-16">
        {hero?.bannerImage && (
          <div className="absolute inset-0 z-0">
            <img src={hero.bannerImage} alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        )}
        {!hero?.bannerImage && (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-950/30 via-background to-cyan-950/20" />
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1">
                <Sparkles size={10} /> PREMIUM ANIME PLATFORM
              </span>
            </div>
            {hero ? (
              <>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
                  {hero.title}
                </h1>
                {hero.description && (
                  <p className="text-muted-foreground text-base md:text-lg mb-8 line-clamp-3">{hero.description}</p>
                )}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setLocation(`/anime/${hero.id}`)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all neon-glow"
                    data-testid="btn-hero-watch"
                  >
                    <Play size={18} /> Watch Now
                  </button>
                  {!user && (
                    <button
                      onClick={() => setLocation("/premium")}
                      className="flex items-center gap-2 px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-xl font-semibold transition-all"
                      data-testid="btn-hero-premium"
                    >
                      <Crown size={18} /> Get Premium
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                  <span className="text-gradient">SHIVAM ANIMES</span>
                  <br /><span className="text-white">FOR PREMIUM USERS</span>
                </h1>
                <p className="text-muted-foreground text-base md:text-lg mb-8">
                  Access exclusive anime episodes with premium protection. The ultimate destination for anime enthusiasts.
                </p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setLocation("/browse")} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all neon-glow" data-testid="btn-browse">
                    <Play size={18} /> Browse Anime
                  </button>
                  {!user && (
                    <button onClick={() => setLocation("/premium")} className="flex items-center gap-2 px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-xl font-semibold transition-all" data-testid="btn-get-premium">
                      <Crown size={18} /> Get Premium
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Featured */}
      {(featured?.length ?? 0) > 0 && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-500 rounded-full inline-block" />
              Trending Now
            </h2>
            <Link href="/browse" className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featured?.slice(0, 6).map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      {(recent?.length ?? 0) > 0 && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-cyan-500 rounded-full inline-block" />
              Recently Added
            </h2>
            <Link href="/browse" className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recent?.slice(0, 12).map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </section>
      )}

      {/* Premium CTA */}
      {!isPremium && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="glass-panel rounded-2xl p-8 border border-yellow-500/20 text-center">
            <Crown size={40} className="text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unlock Premium Access</h2>
            <p className="text-muted-foreground mb-6">Get unlimited access to all anime episodes. Starting at just ₹10 for 15 days.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="glass-panel rounded-xl p-4 border border-yellow-500/20 text-center min-w-[140px]">
                <p className="text-2xl font-black text-yellow-400">₹10</p>
                <p className="text-sm text-muted-foreground">15 Days</p>
              </div>
              <div className="glass-panel rounded-xl p-4 border border-yellow-500/20 text-center min-w-[140px]">
                <p className="text-2xl font-black text-yellow-400">₹19</p>
                <p className="text-sm text-muted-foreground">1 Month</p>
              </div>
            </div>
            <button
              onClick={() => setLocation("/premium")}
              className="mt-6 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all"
              data-testid="btn-cta-premium"
            >
              Buy Premium Now
            </button>
          </div>
        </section>
      )}

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        <p>SHIVAM ANIMES WEB FOR PREMIUM USERS &copy; 2024. All episode links are protected.</p>
      </footer>
    </div>
  );
}
