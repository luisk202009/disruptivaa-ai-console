import { useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import CompanyOnboarding from "@/components/CompanyOnboarding";
import SubscriptionPending from "@/components/SubscriptionPending";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useSubscription } from "@/hooks/useSubscription";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();
  const { isActive: hasActiveSubscription, isLoading: subLoading } = useSubscription();

  const dataReady = !profileLoading && !rolesLoading && !subLoading;
  const needsOnboarding = dataReady && user && !isAdmin && !profile?.company_id;
  const needsSubscription = dataReady && user && !isAdmin && !!profile?.company_id && !hasActiveSubscription;

  // Keep loading screen active until both animation finishes AND data is ready
  const showLoading = isLoading || (user && !dataReady);

  if (needsOnboarding && !showLoading) {
    return <CompanyOnboarding />;
  }

  if (needsSubscription && !showLoading) {
    return <SubscriptionPending />;
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
