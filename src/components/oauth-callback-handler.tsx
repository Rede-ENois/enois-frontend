import { useEffect } from "react";

import { useNavigate } from "@tanstack/react-router";

import { persistOAuthTokens } from "@/lib/auth-session";

export function OAuthCallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    persistOAuthTokens(
      token,
      params.get("refreshToken"),
      params.get("expiresAt"),
      params.get("refreshExpiresAt"),
    );
    navigate({ to: "/feed", replace: true });
  }, [navigate]);

  return null;
}
