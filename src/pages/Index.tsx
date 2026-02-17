import { useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import CompanyOnboarding from "@/components/CompanyOnboarding";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRoles } from "@/hooks/useUserRoles";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  const dataReady = !profileLoading && !rolesLoading;
  const needsOnboarding = dataReady && user && !isAdmin && !profile?.company_id;

  // Keep loading screen active until both animation finishes AND data is ready
  const showLoading = isLoading || (user && !dataReady);

  if (needsOnboarding && !showLoading) {
    return <CompanyOnboarding />;
  }

  return (
    <>
      {showLoading && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}
      
      <div className={`flex min-h-screen w-full transition-opacity duration-500 ${showLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Sidebar />
        <Dashboard />
      </div>
    </>
  );
};

export default Index;
