import { useState } from "react";

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
    google: {
      loading: loading === "GOOGLE",
      start: () => void startOAuth("GOOGLE"),
    },
    apple: {
      loading: loading === "APPLE",
      start: () => void startOAuth("APPLE"),
    },
  };
}
