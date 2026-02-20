import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { Skeleton } from "@/components/ui/skeleton";
import Index from "./pages/Index";
import Conversations from "./pages/Conversations";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Agents from "./pages/Agents";
import Connections from "./pages/Connections";
import MetaCallback from "./pages/MetaCallback";
import GoogleCallback from "./pages/GoogleCallback";
import TikTokCallback from "./pages/TikTokCallback";
import Dashboards from "./pages/Dashboards";
import ProjectDetail from "./pages/ProjectDetail";
import Websites from "./pages/Websites";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded heavy routes
const DashboardView = lazy(() => import("./pages/DashboardView"));
const LandingBuilder = lazy(() => import("./pages/LandingBuilder"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const LazyFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,      // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
  useCompanyBranding();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrandingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/agents" element={<Agents />} />
              <Route
                path="/conversations"
                element={
                  <ProtectedRoute>
                    <Conversations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connections"
                element={
                  <ProtectedRoute>
                    <Connections />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/meta/callback" element={<MetaCallback />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/auth/tiktok/callback" element={<TikTokCallback />} />
              <Route
                path="/dashboards"
                element={
                  <ProtectedRoute>
                    <Dashboards />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboards/:dashboardId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LazyFallback />}>
                      <DashboardView />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LazyFallback />}>
                      <AdminDashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/websites"
                element={
                  <ProtectedRoute>
                    <Websites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/landing-builder"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LazyFallback />}>
                      <LandingBuilder />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </BrandingProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
