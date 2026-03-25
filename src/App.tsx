import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UpdatePassword from "./pages/UpdatePassword";
import Agents from "./pages/Agents";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded routes
const Conversations = lazy(() => import("./pages/Conversations"));
const Settings = lazy(() => import("./pages/Settings"));
const Connections = lazy(() => import("./pages/Connections"));
const MetaCallback = lazy(() => import("./pages/MetaCallback"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));
const TikTokCallback = lazy(() => import("./pages/TikTokCallback"));
const Dashboards = lazy(() => import("./pages/Dashboards"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Websites = lazy(() => import("./pages/Websites"));
const DashboardView = lazy(() => import("./pages/DashboardView"));
const LandingBuilder = lazy(() => import("./pages/LandingBuilder"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SolucionesCanales = lazy(() => import("./pages/SolucionesCanales"));
const SolucionesAnalytics = lazy(() => import("./pages/SolucionesAnalytics"));
const Brief = lazy(() => import("./pages/Brief"));

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
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/soluciones/gestion-canales" element={<Suspense fallback={<LazyFallback />}><SolucionesCanales /></Suspense>} />
              <Route path="/soluciones/data-analytics" element={<Suspense fallback={<LazyFallback />}><SolucionesAnalytics /></Suspense>} />
              <Route path="/brief" element={<Suspense fallback={<LazyFallback />}><Brief /></Suspense>} />

              {/* OAuth callbacks */}
              <Route path="/auth/meta/callback" element={<Suspense fallback={<LazyFallback />}><MetaCallback /></Suspense>} />
              <Route path="/auth/google/callback" element={<Suspense fallback={<LazyFallback />}><GoogleCallback /></Suspense>} />
              <Route path="/auth/tiktok/callback" element={<Suspense fallback={<LazyFallback />}><TikTokCallback /></Suspense>} />

              {/* Protected routes — dashboard is now at /dashboard */}
              <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/conversations" element={<ProtectedRoute><Suspense fallback={<LazyFallback />}><Conversations /></Suspense></ProtectedRoute>} />
              <Route path="/project/:id" element={<ProtectedRoute><Suspense fallback={<LazyFallback />}><ProjectDetail /></Suspense></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Suspense fallback={<LazyFallback />}><Settings /></Suspense></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Suspense fallback={<LazyFallback />}><Connections /></Suspense></ProtectedRoute>} />
              <Route path="/dashboards" element={<ProtectedRoute><Suspense fallback={<LazyFallback />}><Dashboards /></Suspense></ProtectedRoute>} />
              <Route path="/dashboards/:dashboardId" element={<ProtectedRoute><Suspense fallback={<LazyFallback />}><DashboardView /></Suspense></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Suspense fallback={<LazyFallback />}><AdminDashboard /></Suspense></ProtectedRoute>} />
              <Route path="/websites" element={<ProtectedRoute><Suspense fallback={<LazyFallback />}><Websites /></Suspense></ProtectedRoute>} />
              <Route path="/landing-builder" element={<ProtectedRoute><Suspense fallback={<LazyFallback />}><LandingBuilder /></Suspense></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </BrandingProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
