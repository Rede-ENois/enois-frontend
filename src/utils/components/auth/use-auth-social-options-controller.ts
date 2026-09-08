import { useState } from "react";

import { AUTH_SOCIAL_PROVIDERS } from "@/constants/auth-social-providers";
import { texts } from "@/texts";
import type { OAuthStartResponse } from "@/types/application/auth/oauth-start-response";

export function useAuthSocialOptionsController() {
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

  return {
    error,
    disabled: loading !== null,
    providers: AUTH_SOCIAL_PROVIDERS.map((provider) => ({
      ...provider,
      loading: loading === provider.provider,
      action: () => void startOAuth(provider.provider),
    })),
  };
}
