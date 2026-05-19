import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [, setLocation] = useLocation();
  const { login, isAdmin, user } = useAuth();
  const adminLoginMutation = useAdminLogin();
  const { toast } = useToast();

  useEffect(() => { if (isAdmin) setLocation("/admin"); }, [isAdmin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adminLoginMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          login(data);
          setLocation("/admin");
        },
        onError: (err: any) => {
          toast({ title: "Admin login failed", description: err?.data?.error || "Invalid credentials", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-background to-background" />
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="glass-panel rounded-2xl p-8 border border-purple-500/20 neon-glow">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <Shield size={28} className="text-purple-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-muted-foreground mt-1">SHIVAM ANIMES</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                placeholder="Admin username"
                required
                data-testid="input-admin-username"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  placeholder="Admin password"
                  required
                  data-testid="input-admin-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white" data-testid="btn-toggle-admin-pw">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={adminLoginMutation.isPending}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition-all neon-glow"
              data-testid="btn-admin-login"
            >
              {adminLoginMutation.isPending ? "Logging in..." : "Admin Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
