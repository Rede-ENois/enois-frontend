import { useQuery } from "@tanstack/react-query";

import type { NotificationModule } from "@/types/application/notification/notification-module";
import type { UnreadSummary } from "@/types/application/notification/unread-summary";
import type { NavigationCounts } from "@/types/navigation/navigation-counts";
import type { SignalData } from "@rede-enois/design-system/ui";

import { messagesApi, notificationsApi } from "@/lib/api";
import { useInterfaceContext } from "@/lib/interface-context";
import { networkQueries } from "@/lib/query-options/network";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useDisabledModules } from "@/lib/use-personalization";

/** Areas whose news lights the Explore entry (their rooms live there, not in the menu). */
export const EXPLORE_MODULES: NotificationModule[] = ["COMMUNITY_GAMES", "DAILY_GAMES"];

/** What lights each signal, already counted. Pure, so the mapping is tested without React. */
/** The signal of one destination: messages balloon, requests pill, a news dot, or nothing. */
export function signalFor(
  target: { href: string; notifies?: NotificationModule | NotificationModule[] },
  counts: NavigationCounts,
): SignalData | null {
  if (target.href === "/mensagens") {
    return counts.unreadMessages > 0 ? { kind: "messages", count: counts.unreadMessages } : null;
  }
  if (target.href === "/rede") {
    return counts.pendingRequests > 0 ? { kind: "count", count: counts.pendingRequests } : null;
  }
  if (target.href === "/notificacoes") {
    // The summary already leaves out messages and connection requests (their own signals); what is
    // left is what the notices panel lists, minus the modules turned off there too.
    const summary = counts.summary;
    const hidden = [...counts.disabledModules].reduce(
      (sum, module) => sum + (summary?.byModule[module as NotificationModule] ?? 0),
      0,
    );
    const notices = (summary?.total ?? 0) - hidden;
    return notices > 0 ? { kind: "count", count: notices } : null;
  }
  // An event happening today is the one time-bound signal: it wins over the news dot.
  if (target.href === "/eventos" && (counts.summary?.eventsToday ?? 0) > 0) {
    return { kind: "today" };
  }
  if (
    target.href === "/comunidades" &&
    Object.values(counts.summary?.byCommunity ?? {}).some((count) => count > 0)
  ) {
    return { kind: "new" };
  }
  const modules =
    target.href === "/explorar"
      ? EXPLORE_MODULES
      : Array.isArray(target.notifies)
        ? target.notifies
        : target.notifies
          ? [target.notifies]
          : [];
  return modules.some((module) => (counts.summary?.byModule[module] ?? 0) > 0)
    ? { kind: "new" }
    : null;
}

/**
 * One source for every signal on the menu, the dock and Explore: the unread notifications summary
 * (cleared by reading, the same state the bell shows), the unread messages counter shared with the
 * chat dock, and the pending connection requests shared with /rede.
 */
export function useNavigationCounts(): NavigationCounts {
  const authenticated = useIsAuthenticated();
  const context = useInterfaceContext();
  const disabledModules = useDisabledModules();

  const { data: summary } = useQuery({
    // Under ["notifications"]: reading one (or all) invalidates the summary with the list.
    queryKey: ["notifications", "summary", context],
    queryFn: () => notificationsApi.unreadSummary(context),
    enabled: authenticated,
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
  const { data: messages } = useQuery({
    queryKey: ["conversations", "unread-count", context],
    queryFn: () => messagesApi.unreadCount(context),
    enabled: authenticated,
  });
  const { data: requests } = useQuery({
    ...networkQueries.requests(50),
    enabled: authenticated && context === "SOCIAL",
    staleTime: 60_000,
  });

  return {
    summary,
    disabledModules,
    unreadMessages: messages?.count ?? 0,
    pendingRequests: (requests?.items ?? []).filter(
      (request) => request.status === "PENDING" && request.direction === "INCOMING" && request.peer,
    ).length,
  };
}
