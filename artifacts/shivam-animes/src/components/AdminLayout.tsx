import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@workspace/api-client-react";
import { useEffect } from "react";
import {
  LayoutDashboard, Users, Film, Link as LinkIcon,
  Activity, Monitor, LogOut, ChevronRight, Crown
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/anime", label: "Anime CMS", icon: Film },
  { href: "/admin/solve-links", label: "Solve Links", icon: LinkIcon },
  { href: "/admin/activity-logs", label: "Activity Logs", icon: Activity },
  { href: "/admin/sessions", label: "Live Sessions", icon: Monitor },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      setLocation("/admin/login");
    }
  }, [isAdmin, isLoading]);

  if (isLoading || !isAdmin) return null;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, { onSettled: () => { logout(); setLocation("/admin/login"); } });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 flex-shrink-0 glass-panel border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <img src="https://4kwallpapers.com/images/walls/thumbs_2t/22996.jpg" alt="Logo" className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/50" />
            <div>
              <p className="text-xs font-bold text-gradient">ADMIN PANEL</p>
              <p className="text-xs text-muted-foreground">{user?.username}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${active ? "bg-purple-600/20 text-purple-300 border border-purple-500/20" : "text-muted-foreground hover:text-white hover:bg-white/5"}`} data-testid={`nav-admin-${item.label.toLowerCase().replace(" ", "-")}`}>
                  <item.icon size={15} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-sm text-muted-foreground hover:text-white transition-colors" data-testid="btn-admin-logout">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
