import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import Index from "./pages/Index";
import Conversations from "./pages/Conversations";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Agents from "./pages/Agents";
import Connections from "./pages/Connections";
import MetaCallback from "./pages/MetaCallback";
import GoogleCallback from "./pages/GoogleCallback";
import Dashboards from "./pages/Dashboards";
import DashboardView from "./pages/DashboardView";
import ProjectDetail from "./pages/ProjectDetail";
import Websites from "./pages/Websites";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

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
                    <DashboardView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
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
