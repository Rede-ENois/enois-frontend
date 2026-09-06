import { useState } from "react";

import { Loader2 } from "lucide-react";

import { AppleIcon } from "@/assets/svgs/apple-icon";
import { GoogleIcon } from "@/assets/svgs/google-icon";
import { texts } from "@/texts";

type OAuthProvider = "GOOGLE" | "APPLE";

const oauthProviders: Record<OAuthProvider, { name: string; label: string; Icon: React.ElementType }> = {
  GOOGLE: { name: "Google", label: texts.auth.social.google, Icon: GoogleIcon },
  APPLE: { name: "Apple", label: texts.auth.social.apple, Icon: AppleIcon },
};

export function AuthSocialButtons() {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [oauthError, setOAuthError] = useState<string | null>(null);

  const handleOAuthStart = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    setOAuthError(null);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setOAuthError(texts.auth.social.unavailable(oauthProviders[provider].name));
    setLoadingProvider(null);
  };

  return (
    <div className="grid gap-2">
      {(Object.entries(oauthProviders) as [OAuthProvider, (typeof oauthProviders)[OAuthProvider]][]).map(
        ([provider, config]) => {
          const { Icon } = config;
          return (
            <button
              key={provider}
              type="button"
              onClick={() => handleOAuthStart(provider)}
              disabled={loadingProvider !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              {loadingProvider === provider ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {config.label}
            </button>
          );
        },
      )}
      {oauthError && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{oauthError}</p>
      )}
    </div>
  );
}
