import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import BrowsePage from "@/pages/browse";
import AnimeDetailPage from "@/pages/anime-detail";
import DashboardPage from "@/pages/dashboard";
import FavoritesPage from "@/pages/favorites";
import SolveLinkPage from "@/pages/solve-link";
import PremiumPage from "@/pages/premium";
import AdminLoginPage from "@/pages/admin/login";
import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import AdminAnimePage from "@/pages/admin/anime";
import AdminEpisodesPage from "@/pages/admin/episodes";
import AdminSolveLinksPage from "@/pages/admin/solve-links";
import AdminActivityLogsPage from "@/pages/admin/activity-logs";
import AdminSessionsPage from "@/pages/admin/sessions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/browse" component={BrowsePage} />
      <Route path="/anime/:id" component={AnimeDetailPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/solve-link" component={SolveLinkPage} />
      <Route path="/premium" component={PremiumPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/anime" component={AdminAnimePage} />
      <Route path="/admin/anime/:id/episodes" component={AdminEpisodesPage} />
      <Route path="/admin/solve-links" component={AdminSolveLinksPage} />
      <Route path="/admin/activity-logs" component={AdminActivityLogsPage} />
      <Route path="/admin/sessions" component={AdminSessionsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
