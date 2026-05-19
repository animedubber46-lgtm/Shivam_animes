import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Menu, X, Crown, LogOut, User, Heart, LayoutDashboard, Search } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const logoutMutation = useLogout();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logout();
        setLocation("/");
        toast({ title: "Logged out successfully" });
      },
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://4kwallpapers.com/images/walls/thumbs_2t/22996.jpg"
              alt="Logo"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/50"
              data-testid="logo"
            />
            <span className="text-sm font-bold text-gradient hidden sm:block leading-tight">
              SHIVAM ANIMES<br />
              <span className="text-xs font-normal text-purple-400">PREMIUM</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="text-sm text-muted-foreground hover:text-white transition-colors">Browse</Link>
            {user && !isAdmin && (
              <>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-white transition-colors">Dashboard</Link>
                <Link href="/favorites" className="text-sm text-muted-foreground hover:text-white transition-colors">Favorites</Link>
              </>
            )}
            <Link href="/solve-link" className="text-sm text-muted-foreground hover:text-white transition-colors">Solve Link</Link>
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link href="/premium">
                  <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full hover:bg-yellow-500/30 transition-all" data-testid="btn-buy-premium-nav">
                    <Crown size={12} /> Buy Premium
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-4 py-1.5 text-sm font-medium bg-purple-600 hover:bg-purple-500 rounded-full transition-all neon-glow" data-testid="btn-login-nav">Login</button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {user.isPremium && (
                  <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full">
                    <Crown size={10} /> Premium
                  </span>
                )}
                {isAdmin && (
                  <Link href="/admin">
                    <button className="text-xs text-purple-400 hover:text-purple-300" data-testid="btn-admin-dashboard">Admin</button>
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors" data-testid="btn-logout">
                  <LogOut size={14} />
                </button>
              </div>
            )}
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} data-testid="btn-mobile-menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden glass-panel border-t border-white/5 px-4 py-4 space-y-3">
          <Link href="/browse" className="block text-sm text-muted-foreground hover:text-white" onClick={() => setMenuOpen(false)}>Browse</Link>
          {user && !isAdmin && (
            <>
              <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-white" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/favorites" className="block text-sm text-muted-foreground hover:text-white" onClick={() => setMenuOpen(false)}>Favorites</Link>
            </>
          )}
          <Link href="/solve-link" className="block text-sm text-muted-foreground hover:text-white" onClick={() => setMenuOpen(false)}>Solve Link</Link>
          {!user && (
            <Link href="/premium" className="block text-sm text-yellow-400" onClick={() => setMenuOpen(false)}>Buy Premium</Link>
          )}
        </div>
      )}
    </nav>
  );
}
