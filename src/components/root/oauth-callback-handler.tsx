import { useEffect } from "react";

import { useNavigate } from "@tanstack/react-router";

import { consumeOAuthSession } from "@/utils/session";

export function OAuthCallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (consumeOAuthSession(window.location.search)) {
      navigate({ to: "/feed", replace: true });
    }
  }, [navigate]);

  return null;
}
