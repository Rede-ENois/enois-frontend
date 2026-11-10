import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { NotificationsPanel } from "@rede-enois/design-system/domain";

import { useInterfaceContext } from "@/lib/interface-context";
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
