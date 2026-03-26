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
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const Brief = lazy(() => import("./pages/Brief"));

// Páginas de servicios
const Negocio14Dias = lazy(() => import("./pages/Negocio14Dias"));
const CrmHubspot = lazy(() => import("./pages/servicios/CrmHubspot"));
const ShopifyPage = lazy(() => import("./pages/servicios/Shopify"));
const MarketingAds = lazy(() => import("./pages/servicios/MarketingAds"));
const WebsitesLandings = lazy(() => import("./pages/servicios/WebsitesLandings"));
const MvpAplicaciones = lazy(() => import("./pages/servicios/MvpAplicaciones"));
const Nosotros = lazy(() => import("./pages/Nosotros"));

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

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LazyFallback />}>{children}</Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrandingProvider>
          <BrowserRouter>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/agents" element={<Agents />} />

              {/* Páginas de servicios */}
              <Route path="/servicios/negocio-14-dias" element={<Lazy><Negocio14Dias /></Lazy>} />
              <Route path="/servicios/crm-hubspot" element={<Lazy><CrmHubspot /></Lazy>} />
              <Route path="/servicios/shopify" element={<Lazy><ShopifyPage /></Lazy>} />
              <Route path="/servicios/marketing-ads" element={<Lazy><MarketingAds /></Lazy>} />
              <Route path="/servicios/websites-landings" element={<Lazy><WebsitesLandings /></Lazy>} />
              <Route path="/servicios/mvp-aplicaciones" element={<Lazy><MvpAplicaciones /></Lazy>} />

              {/* Brief público */}
              <Route path="/brief" element={<Lazy><Brief /></Lazy>} />

              {/* OAuth callbacks */}
              <Route path="/auth/meta/callback" element={<Lazy><MetaCallback /></Lazy>} />
              <Route path="/auth/google/callback" element={<Lazy><GoogleCallback /></Lazy>} />
              <Route path="/auth/tiktok/callback" element={<Lazy><TikTokCallback /></Lazy>} />

              {/* Rutas protegidas */}
              <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/conversations" element={<ProtectedRoute><Lazy><Conversations /></Lazy></ProtectedRoute>} />
              <Route path="/project/:id" element={<ProtectedRoute><Lazy><ProjectDetail /></Lazy></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Lazy><Settings /></Lazy></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Lazy><Connections /></Lazy></ProtectedRoute>} />
              <Route path="/dashboards" element={<ProtectedRoute><Lazy><Dashboards /></Lazy></ProtectedRoute>} />
              <Route path="/dashboards/:dashboardId" element={<ProtectedRoute><Lazy><DashboardView /></Lazy></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Lazy><AdminDashboard /></Lazy></ProtectedRoute>} />
              <Route path="/admin/leads" element={<ProtectedRoute><Lazy><AdminLeads /></Lazy></ProtectedRoute>} />
              <Route path="/websites" element={<ProtectedRoute><Lazy><Websites /></Lazy></ProtectedRoute>} />
              <Route path="/landing-builder" element={<ProtectedRoute><Lazy><LandingBuilder /></Lazy></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </BrandingProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
