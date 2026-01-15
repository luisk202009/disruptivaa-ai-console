import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const META_APP_ID = "861442349805787";
const SCOPES = "ads_read,ads_management";

interface MetaOAuthButtonProps {
  isConnecting: boolean;
  disabled?: boolean;
}

const MetaOAuthButton = ({ isConnecting, disabled }: MetaOAuthButtonProps) => {
  const initiateOAuth = () => {
    // Generate CSRF protection state
    const state = crypto.randomUUID();
    sessionStorage.setItem("meta_oauth_state", state);

    // Build redirect URI
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/meta/callback`);

    // Construct Meta authorization URL
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${redirectUri}&scope=${SCOPES}&state=${state}`;

    // Redirect to Facebook
    window.location.href = authUrl;
  };

  return (
    <Button
      className="w-full gap-2"
      style={{ backgroundColor: "#1877F2" }}
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
            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
          </svg>
          Conectar con Meta
        </>
      )}
    </Button>
  );
};

export default MetaOAuthButton;
