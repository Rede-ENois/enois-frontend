import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { NotificationsPanel } from "@rede-enois/design-system/domain";

import { notificationsApi } from "@/lib/api";
import { useInterfaceContext } from "@/lib/interface-context";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { useNotificationsPanel } from "@/components/notifications/use-notifications-panel";

export const Route = createFileRoute("/notificacoes/")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.notificationsPage.seoTitle }] }),
  component: NotificationsPage,
});

/** Every notice, grouped by day, with more pages on demand: where a tapped push lands. */
function NotificationsPage() {
  const context = useInterfaceContext();
  const list = useInfiniteQuery({
    queryKey: ["notifications", "page", context],
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam, 30, context),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const panel = useNotificationsPanel(list.data?.pages.flatMap((page) => page.items) ?? [], {
    requestsEnabled: true,
  });

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl min-w-0">
        <NotificationsPanel
          {...panel}
          variant="page"
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
        />
      </div>
    </AppContainer>
  );
}
