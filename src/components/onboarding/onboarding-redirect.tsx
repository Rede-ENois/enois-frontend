import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { authApi } from "@/lib/api";
import { ONBOARDING_PATH, shouldRedirectToOnboarding } from "@/lib/onboarding";
import { hasSession } from "@/lib/require-auth";

/**
 * Guarda central do onboarding, montada no root: o redirecionamento do login não cobre quem chega
 * ao `/feed` por deep link, aba restaurada ou outro aparelho. Só consulta `/auth/me` no feed e só
 * desvia uma vez por sessão, então quem sai do onboarding sem concluir nunca fica preso.
 */
export function OnboardingRedirect() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onFeed = pathname === "/feed";

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
    enabled: onFeed && hasSession(),
    staleTime: 60_000,
  });

  useEffect(() => {
    // No "shown" mark here: the onboarding screen writes it when it mounts, so a navigation that
    // gets lost leaves the redirect armed for the next visit instead of silently spending it.
    if (!shouldRedirectToOnboarding(pathname, user)) return;
    void navigate({ to: ONBOARDING_PATH, replace: true });
  }, [pathname, user, navigate]);

  return null;
}
