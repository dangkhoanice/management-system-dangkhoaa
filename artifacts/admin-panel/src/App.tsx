import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import OrdersPage from "@/pages/orders";
import VehiclesPage from "@/pages/vehicles";
import DriversPage from "@/pages/drivers";
import AssignmentsPage from "@/pages/assignments";
import UsersPage from "@/pages/users";
import { Loader2, Menu } from "lucide-react";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar open={sidebarOpen} user={user} onLogout={logout} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-4 h-14 border-b border-border bg-card shrink-0">
          <button
            data-testid="button-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-foreground leading-none">{user.username}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.isAdmin ? "Quản trị viên" : "Nhân viên"}</p>
            </div>
            <button
              data-testid="button-logout"
              onClick={logout}
              className="text-sm text-destructive hover:text-destructive/80 font-medium transition-colors ml-2"
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (user && !user.isAdmin) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedLayout><DashboardPage /></ProtectedLayout>
      </Route>
      <Route path="/orders">
        <ProtectedLayout><OrdersPage /></ProtectedLayout>
      </Route>
      <Route path="/vehicles">
        <ProtectedLayout><VehiclesPage /></ProtectedLayout>
      </Route>
      <Route path="/drivers">
        <ProtectedLayout><DriversPage /></ProtectedLayout>
      </Route>
      <Route path="/assignments">
        <ProtectedLayout><AssignmentsPage /></ProtectedLayout>
      </Route>
      <Route path="/users">
        <ProtectedLayout><AdminRoute component={UsersPage} /></ProtectedLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
