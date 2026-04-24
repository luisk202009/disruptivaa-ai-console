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
const Projects = lazy(() => import("./pages/Projects"));
const Websites = lazy(() => import("./pages/Websites"));
const DashboardView = lazy(() => import("./pages/DashboardView"));
const LandingBuilder = lazy(() => import("./pages/LandingBuilder"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminCompanies = lazy(() => import("./pages/admin/AdminCompanies"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));
const AdminProposals = lazy(() => import("./pages/admin/AdminProposals"));
const AdminProposalTemplates = lazy(() => import("./pages/admin/AdminProposalTemplates"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const ProposalView = lazy(() => import("./pages/ProposalView"));
const Brief = lazy(() => import("./pages/Brief"));

// Páginas de servicios
const Negocio14Dias = lazy(() => import("./pages/Negocio14Dias"));
const CrmHubspot = lazy(() => import("./pages/servicios/CrmHubspot"));
const ShopifyPage = lazy(() => import("./pages/servicios/Shopify"));
const MarketingAds = lazy(() => import("./pages/servicios/MarketingAds"));
const WebsitesLandings = lazy(() => import("./pages/servicios/WebsitesLandings"));
const MvpAplicaciones = lazy(() => import("./pages/servicios/MvpAplicaciones"));
const Nosotros = lazy(() => import("./pages/Nosotros"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const WhatsAppLinkGenerator = lazy(() => import("./pages/WhatsAppLinkGenerator"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const WaRedirect = lazy(() => import("./pages/WaRedirect"));
const WhatsAppLinksPage = lazy(() => import("./pages/dashboard/WhatsAppLinksPage"));
const WhatsAppLinkNew = lazy(() => import("./pages/dashboard/WhatsAppLinkNew"));
const WhatsAppLinkEdit = lazy(() => import("./pages/dashboard/WhatsAppLinkEdit"));
const WhatsAppLinkAnalytics = lazy(() => import("./pages/dashboard/WhatsAppLinkAnalytics"));

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
              <Route path="/lista-de-espera" element={<Lazy><Waitlist /></Lazy>} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/agents" element={<Agents />} />

              {/* Páginas de servicios */}
              <Route path="/servicios/negocio-14-dias" element={<Lazy><Negocio14Dias /></Lazy>} />
              <Route path="/servicios/crm-hubspot" element={<Lazy><CrmHubspot /></Lazy>} />
              <Route path="/servicios/shopify" element={<Lazy><ShopifyPage /></Lazy>} />
              <Route path="/servicios/marketing-ads" element={<Lazy><MarketingAds /></Lazy>} />
              <Route path="/servicios/websites-landings" element={<Lazy><WebsitesLandings /></Lazy>} />
              <Route path="/servicios/mvp-aplicaciones" element={<Lazy><MvpAplicaciones /></Lazy>} />
              <Route path="/nosotros" element={<Lazy><Nosotros /></Lazy>} />
              <Route path="/pricing" element={<Lazy><Pricing /></Lazy>} />
              <Route path="/blog" element={<Lazy><Blog /></Lazy>} />
              <Route path="/blog/:slug" element={<Lazy><BlogPost /></Lazy>} />
              <Route path="/whatsapp-link" element={<Lazy><WhatsAppLinkGenerator /></Lazy>} />
              <Route path="/wa/:slug" element={<Lazy><WaRedirect /></Lazy>} />
              <Route path="/p/:slug" element={<Lazy><ProposalView /></Lazy>} />
              <Route path="/propuesta/:slug" element={<Lazy><ProposalView /></Lazy>} />

              {/* Brief público */}
              <Route path="/brief" element={<Lazy><Brief /></Lazy>} />

              {/* OAuth callbacks */}
              <Route path="/auth/meta/callback" element={<Lazy><MetaCallback /></Lazy>} />
              <Route path="/auth/google/callback" element={<Lazy><GoogleCallback /></Lazy>} />
              <Route path="/auth/tiktok/callback" element={<Lazy><TikTokCallback /></Lazy>} />

              {/* Rutas protegidas */}
              <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/conversations" element={<ProtectedRoute><Lazy><Conversations /></Lazy></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Lazy><Projects /></Lazy></ProtectedRoute>} />
              <Route path="/project/:id" element={<ProtectedRoute><Lazy><ProjectDetail /></Lazy></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Lazy><Settings /></Lazy></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Lazy><Connections /></Lazy></ProtectedRoute>} />
              <Route path="/dashboards" element={<ProtectedRoute><Lazy><Dashboards /></Lazy></ProtectedRoute>} />
              <Route path="/dashboards/:dashboardId" element={<ProtectedRoute><Lazy><DashboardView /></Lazy></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Lazy><AdminDashboard /></Lazy></ProtectedRoute>} />
              <Route path="/admin/leads" element={<ProtectedRoute><Lazy><AdminLayout><AdminLeads /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/admin/companies" element={<ProtectedRoute><Lazy><AdminLayout><AdminCompanies /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><Lazy><AdminLayout><AdminUsers /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/admin/subscriptions" element={<ProtectedRoute><Lazy><AdminLayout><AdminSubscriptions /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute><Lazy><AdminLayout><AdminNotifications /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/admin/emails" element={<ProtectedRoute><Lazy><AdminLayout><AdminEmails /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/admin/proposals" element={<ProtectedRoute><Lazy><AdminLayout><AdminProposals /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/admin/proposal-templates" element={<ProtectedRoute><Lazy><AdminLayout><AdminProposalTemplates /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><Lazy><AdminLayout><AdminSettings /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/admin/plans" element={<ProtectedRoute><Lazy><AdminLayout><AdminPlans /></AdminLayout></Lazy></ProtectedRoute>} />
              <Route path="/websites" element={<ProtectedRoute><Lazy><Websites /></Lazy></ProtectedRoute>} />
              <Route path="/landing-builder" element={<ProtectedRoute><Lazy><LandingBuilder /></Lazy></ProtectedRoute>} />

              {/* WhatsApp Links (autenticado) */}
              <Route path="/dashboard/ecosistema/whatsapp-links" element={<ProtectedRoute><Lazy><WhatsAppLinksPage /></Lazy></ProtectedRoute>} />
              <Route path="/dashboard/ecosistema/whatsapp-links/nuevo" element={<ProtectedRoute><Lazy><WhatsAppLinkNew /></Lazy></ProtectedRoute>} />
              <Route path="/dashboard/ecosistema/whatsapp-links/:id/editar" element={<ProtectedRoute><Lazy><WhatsAppLinkEdit /></Lazy></ProtectedRoute>} />
              <Route path="/dashboard/ecosistema/whatsapp-links/:id/analitica" element={<ProtectedRoute><Lazy><WhatsAppLinkAnalytics /></Lazy></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </BrandingProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
