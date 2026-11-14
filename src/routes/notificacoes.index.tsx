import { useCallback } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { NotificationsPanel } from "@rede-enois/design-system/domain";
import { PullIndicator } from "@rede-enois/design-system/ui";

import { useInterfaceContext } from "@/lib/interface-context";
import { usePullToRefresh } from "@/lib/pull-to-refresh";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { useNotificationsList } from "@/components/notifications/use-notifications-list";
import { useNotificationsPanel } from "@/components/notifications/use-notifications-panel";

export const Route = createFileRoute("/notificacoes/")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.notificationsPage.seoTitle }] }),
  component: NotificationsPage,
});

/** Every notice, grouped by day, with more pages on demand: where a tapped push lands. */
function NotificationsPage() {
  const context = useInterfaceContext();
  // A MESMA lista do sino do header (uma chave, um fetch): abrir Avisos pelo dock reusa o que
  // já veio — no celular o sino segue montado (escondido abaixo de lg), e ter duas consultas
  // com limites diferentes duplicava a chamada e fazia a página piscar em toda revalidação.
  const list = useNotificationsList(context);

  const panel = useNotificationsPanel(list.items, {
    requestsEnabled: true,
  });

  const refreshing = list.isFetching && !list.isFetchingNextPage;
  const refetch = list.refetch;
  // Puxar para renovar no topo, em toque: o mesmo gesto do feed, renovando SÓ a lista de avisos.
  const pullToRefresh = usePullToRefresh(
    useCallback(() => void refetch(), [refetch]),
    refreshing,
  );

  return (
    <AppContainer>
      <div className="relative mx-auto w-full max-w-2xl min-w-0">
        {/* Indicador do gesto (DS): acompanha o dedo ao puxar e fica girando enquanto a lista
            renova, para o gesto não parecer que não fez nada. */}
        {(pullToRefresh.pulling || refreshing) && (
          <PullIndicator
            pull={refreshing ? pullToRefresh.trigger : pullToRefresh.pull}
            trigger={pullToRefresh.trigger}
          />
        )}

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
