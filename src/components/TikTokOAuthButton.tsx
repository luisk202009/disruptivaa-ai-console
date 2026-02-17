import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// TikTok App ID is a public identifier (like Google Client ID), safe to expose in frontend
// Set VITE_TIKTOK_APP_ID in .env or hardcode here after obtaining from TikTok for Business portal
const TIKTOK_APP_ID = import.meta.env.VITE_TIKTOK_APP_ID || "";

interface TikTokOAuthButtonProps {
  isConnecting: boolean;
  disabled?: boolean;
}

const TikTokOAuthButton = ({ isConnecting, disabled }: TikTokOAuthButtonProps) => {
  const initiateOAuth = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem("tiktok_oauth_state", state);

    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/tiktok/callback`);

    const authUrl = `https://business-api.tiktok.com/portal/auth?app_id=${TIKTOK_APP_ID}&state=${state}&redirect_uri=${redirectUri}`;

    window.location.href = authUrl;
  };

  return (
    <Button
      className="w-full gap-2"
      style={{ backgroundColor: "#000000" }}
      onClick={initiateOAuth}
      disabled={isConnecting || disabled}
    >
      {isConnecting ? (
        <>
          <Loader2 className="animate-spin" size={16} />
          Conectando...
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
          Conectar con TikTok
        </>
      )}
    </Button>
  );
};

export default TikTokOAuthButton;
