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

export function SocialButtons() {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startOAuth = async (provider: OAuthProvider) => {
    setLoading(provider);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setError(texts.auth.social.unavailable(oauthProviders[provider].name));
    setLoading(null);
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
              onClick={() => startOAuth(provider)}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              {loading === provider ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {config.label}
            </button>
          );
        },
      )}
      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
