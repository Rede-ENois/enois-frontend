import { useState } from "react";

import { Loader2 } from "lucide-react";

import { texts } from "@/texts";
import type { OAuthStartResponse } from "@/types/application/auth/oauth-start-response";

import { SocialProviderIcon } from "./social-provider-icon";

export function AuthSocialOptions() {
  const [loading, setLoading] = useState<OAuthStartResponse["provider"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startOAuth = async (provider: OAuthStartResponse["provider"]) => {
    setLoading(provider);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const providerName = provider === "GOOGLE" ? "Google" : "Apple";
    setError(texts.auth.social.unavailable(providerName));
    setLoading(null);
  };

  return (
    <>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => startOAuth("GOOGLE")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
        >
          {loading === "GOOGLE" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SocialProviderIcon provider="GOOGLE" />
          )}
          <>{texts.auth.social.google}</>
        </button>
        <button
          type="button"
          onClick={() => startOAuth("APPLE")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
        >
          {loading === "APPLE" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SocialProviderIcon provider="APPLE" />
          )}
          <>{texts.auth.social.apple}</>
        </button>
        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <>{texts.auth.social.divider}</>
        <div className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
