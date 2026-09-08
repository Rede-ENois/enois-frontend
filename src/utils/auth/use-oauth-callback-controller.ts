import { useEffect } from "react";

import { useNavigate } from "@tanstack/react-router";

import { persistAuthTokens } from "@/lib/auth-session/persist-auth-tokens";

export function useOAuthCallbackController() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    persistAuthTokens({
      token,
      refreshToken: params.get("refreshToken"),
      expiresAt: params.get("expiresAt"),
      refreshExpiresAt: params.get("refreshExpiresAt"),
    });
    navigate({ to: "/feed", replace: true });
  }, [navigate]);
}
