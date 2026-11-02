import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import type { ContextSwitcherProps } from "@/types/components/navigation/context-switcher-props";
import {
  ContextSwitcher as ContextSwitcherView,
  type InterfaceContext,
} from "@rede-enois/design-system/domain";

import { corporateApi } from "@/lib/api";
import {
  destinationAfterSwitch,
  professionalReady,
  useInterfaceContext,
  writeStoredContext,
} from "@/lib/interface-context";
import { hasSessionFlag } from "@/lib/session";

/**
 * Social / Profissional on top of the menu. Switching keeps the session and the page when the page
 * is shared by both interfaces; a page that belongs to the other interface goes to its home.
 */
export function ContextSwitcher({ collapsed = false, onNavigate }: ContextSwitcherProps) {
  const context = useInterfaceContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  // Same key the profile pages use: one request feeds the switcher, the feed and /profissional.
  const { data: corporate, isSuccess } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => corporateApi.me(),
    enabled: hasSessionFlag(),
    staleTime: 120_000,
  });

  const choose = (next: InterfaceContext) => {
    writeStoredContext(next);
    const destination = destinationAfterSwitch(pathname, next);
    if (destination) void navigate({ to: destination });
    onNavigate?.();
  };

  return (
    <ContextSwitcherView
      value={context}
      onChange={choose}
      collapsed={collapsed}
      // Only once the profile is known: a loading state must not flash "ative seu perfil".
      professionalSetupHref={isSuccess && !professionalReady(corporate) ? "/profissional" : null}
      onNavigate={onNavigate}
    />
  );
}
