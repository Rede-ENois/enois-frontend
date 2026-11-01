/**
 * Which interface the app is showing: Social (community) or Profissional (work).
 *
 * One account, two interfaces. The route decides first: a page that belongs to one interface
 * (vagas, comunidades...) always opens in it, so a shared link lands in the right place. Pages
 * shared by both (feed, mensagens, carteira...) follow the last interface the person chose, kept
 * on the device like the theme.
 *
 * This is navigation, not authorization: the backend resolves the identity of every operation
 * from the session and refuses professional actions without an active professional profile.
 */
import { useEffect, useSyncExternalStore } from "react";

import { useRouterState } from "@tanstack/react-router";

import type { CorporateProfileView } from "@/types/application/corporate/corporate-profile-view";
import type { ProfessionalProfileState } from "@/types/application/corporate/professional-profile-state";
import type { InterfaceContext } from "@rede-enois/design-system/domain";

// Same key the old identity toggle used, so the last choice survives the upgrade.
const STORAGE_KEY = "connect-grow-active-identity";
const CHANGE_EVENT = "connect-grow-active-identity-change";

/** Route prefixes that belong to ONE interface. Everything else is shared. */
const EXCLUSIVE_PREFIXES: [prefix: string, context: InterfaceContext][] = [
  ["/vagas", "PROFESSIONAL"],
  ["/freelances", "PROFESSIONAL"],
  ["/empresas", "PROFESSIONAL"],
  ["/empresa", "PROFESSIONAL"],
  ["/mentoria", "PROFESSIONAL"],
  ["/servicos", "PROFESSIONAL"],
  ["/meus-servicos", "PROFESSIONAL"],
  ["/profissional", "PROFESSIONAL"],
  ["/rede", "SOCIAL"],
  ["/comunidades", "SOCIAL"],
  ["/grupos", "SOCIAL"],
  ["/salvos", "SOCIAL"],
  ["/blogs", "SOCIAL"],
  ["/blog", "SOCIAL"],
  ["/eventos", "SOCIAL"],
  ["/par-de-estudo", "SOCIAL"],
  ["/games", "SOCIAL"],
  ["/jogos-diarios", "SOCIAL"],
  ["/projetos", "SOCIAL"],
  ["/perfil", "SOCIAL"],
];

/** Where switching lands when the current page belongs to the other interface. */
export const CONTEXT_HOME: Record<InterfaceContext, string> = {
  SOCIAL: "/feed",
  PROFESSIONAL: "/feed",
};

/** The interface a path belongs to, or null when both interfaces share it. */
export function contextOfPath(pathname: string): InterfaceContext | null {
  for (const [prefix, context] of EXCLUSIVE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return context;
  }
  return null;
}

export function readStoredContext(): InterfaceContext {
  if (typeof window === "undefined") return "SOCIAL";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // "CORPORATE" is what the old identity toggle wrote.
    return stored === "PROFESSIONAL" || stored === "CORPORATE" ? "PROFESSIONAL" : "SOCIAL";
  } catch {
    return "SOCIAL";
  }
}

export function writeStoredContext(context: InterfaceContext) {
  if (typeof window === "undefined" || readStoredContext() === context) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, context);
  } catch {
    // Private mode or blocked storage: the switch still works for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The active interface: the route's own when it has one, otherwise the stored choice. */
export function resolveContext(pathname: string, stored: InterfaceContext): InterfaceContext {
  return contextOfPath(pathname) ?? stored;
}

/**
 * The active interface for the current route. Opening a page of one interface also makes it the
 * stored choice, so going back to a shared page (feed, mensagens) stays in the same interface.
 * The server snapshot is SOCIAL: the device choice only exists in the browser.
 */
export function useInterfaceContext(): InterfaceContext {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const stored = useSyncExternalStore(subscribe, readStoredContext, () => "SOCIAL" as const);
  const routeContext = contextOfPath(pathname);

  useEffect(() => {
    if (routeContext) writeStoredContext(routeContext);
  }, [routeContext]);

  return routeContext ?? stored;
}

/**
 * Where to go after switching to `next`: stay on a shared page (no indiscriminate jump to the
 * home), go to the interface home when the page belongs to the other interface.
 */
export function destinationAfterSwitch(pathname: string, next: InterfaceContext): string | null {
  const routeContext = contextOfPath(pathname);
  return routeContext && routeContext !== next ? CONTEXT_HOME[next] : null;
}

/** The professional profile can sign and act (applications, BUSINESS posts) only when ACTIVE. */
export function professionalReady(profile: CorporateProfileView | null | undefined): boolean {
  return Boolean(profile?.exists && profile.status === "ACTIVE");
}

/**
 * Reads the professional profile query without mistaking "unknown" for "none": data wins (even a
 * stale copy while a refetch fails), then a failure is ERROR, otherwise it is still LOADING.
 */
export function professionalProfileState(query: {
  data: CorporateProfileView | null | undefined;
  isError: boolean;
}): ProfessionalProfileState {
  if (query.data !== undefined) return professionalReady(query.data) ? "ACTIVE" : "NOT_READY";
  return query.isError ? "ERROR" : "LOADING";
}

/** The identity that signs what the person does here: professional only with an active profile. */
export function effectiveIdentity(
  context: InterfaceContext,
  profile: CorporateProfileView | null | undefined,
): "SOCIAL" | "CORPORATE" {
  return context === "PROFESSIONAL" && professionalReady(profile) ? "CORPORATE" : "SOCIAL";
}
