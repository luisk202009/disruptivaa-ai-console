import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// This is a public client ID - safe to expose in frontend code
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // Replace with actual client ID from Google Cloud Console
const SCOPES = "https://www.googleapis.com/auth/adwords";

interface GoogleOAuthButtonProps {
  isConnecting: boolean;
  disabled?: boolean;
}

const GoogleOAuthButton = ({ isConnecting, disabled }: GoogleOAuthButtonProps) => {
  const initiateOAuth = () => {
    // Generate CSRF protection state
    const state = crypto.randomUUID();
    sessionStorage.setItem("google_oauth_state", state);

    // Build redirect URI
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);

    // Construct Google authorization URL
    // access_type=offline: Request refresh token
    // prompt=consent: Force consent screen to ensure we get refresh token
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent&state=${state}`;

    // Redirect to Google
    window.location.href = authUrl;
  };

  return (
    <Button
      className="w-full gap-2"
      style={{ backgroundColor: "#4285F4" }}
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
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path fill="#fff" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
          </svg>
          Conectar con Google
        </>
      )}
    </Button>
  );
};

export default GoogleOAuthButton;
