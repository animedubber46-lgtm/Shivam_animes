import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { getDeviceFingerprint } from "@/lib/device";
import { useToast } from "@/hooks/use-toast";
import { Crown, Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [, setLocation] = useLocation();
  const { login, user } = useAuth();
  const loginMutation = useLogin();
  const { toast } = useToast();

  useEffect(() => { if (user) setLocation("/"); }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deviceId = getDeviceFingerprint();
    loginMutation.mutate(
      { data: { username, password, deviceId, deviceInfo: navigator.userAgent } },
      {
        onSuccess: (data) => {
          login(data);
          toast({ title: "Welcome back!", description: `Logged in as ${data.user.username}` });
          setLocation("/");
        },
        onError: (err: any) => {
          const msg = err?.data?.error || "Invalid credentials";
          toast({ title: "Login failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-background to-cyan-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Buy Premium banner */}
        <Link href="/premium">
          <div className="glass-panel rounded-xl p-3 border border-yellow-500/30 mb-4 flex items-center justify-center gap-2 cursor-pointer hover:border-yellow-400/50 transition-all" data-testid="btn-buy-premium-login">
            <Crown size={16} className="text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Buy Premium — From ₹10 only!</span>
            <span className="text-xs text-muted-foreground ml-auto">Click here →</span>
          </div>
        </Link>

        {/* Login card */}
        <div className="glass-panel rounded-2xl p-8 border border-white/5 neon-glow">
          <div className="text-center mb-8">
            <img
              src="https://4kwallpapers.com/images/walls/thumbs_2t/22996.jpg"
              alt="Logo"
              className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-purple-500/50"
            />
            <h1 className="text-xl font-bold text-white">SHIVAM ANIMES</h1>
            <p className="text-sm text-purple-400 font-medium">FOR PREMIUM USERS</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                placeholder="Enter username"
                required
                data-testid="input-username"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  placeholder="Enter password"
                  required
                  data-testid="input-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white" data-testid="btn-toggle-password">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all neon-glow"
              data-testid="btn-submit-login"
            >
              <LogIn size={16} />
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/premium" className="text-purple-400 hover:text-purple-300">Buy Premium</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link href="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
        </p>
      </div>
    </div>
  );
}
