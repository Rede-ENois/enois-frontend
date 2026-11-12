import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import type { Notification } from "@/types/application/notification/notification";
import type { InterfaceContext } from "@rede-enois/design-system/domain";

import { notificationsApi } from "@/lib/api";
import { useInboxPollInterval } from "@/lib/message-stream";
import { useLiteMode } from "@/lib/use-lite-mode";

/**
 * The one list of notices behind the bell and the full page, under a single query key: one fetch
 * per context, and whoever arrives second (the bell on desktop, the whole page on the phone)
 * reuses the cache instead of asking the server for a second copy. The key sits under
 * ["notifications"], so reading a row and the summary behind the menu signals invalidate together.
 */
export const PAGE_SIZE = 10;

/** How many rows the bell previews — sliced from the page it already has, no extra request. */
export const PREVIEW_SIZE = 10;

/**
 * Recarga de segurança enquanto o stream estiver fora. Com ele aberto o valor é `false`: o aviso
 * chega por evento, não por consulta periódica.
 */
export const NOTIFICATIONS_POLL_MS = 60_000;

export function useNotificationsList(context: InterfaceContext, enabled = true) {
  const lite = useLiteMode();
  // Com o stream aberto o aviso chega sozinho (`event: notification`) e não há o que consultar;
  // sem ele (offline, proxy que corta a conexão, sessão expirada) esta recarga é a rede de
  // segurança para o sino não ficar parado até a pessoa recarregar a página.
  const pollMs = useInboxPollInterval(NOTIFICATIONS_POLL_MS, lite);

  const list = useInfiniteQuery({
    queryKey: ["notifications", context],
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam, PAGE_SIZE, context),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    staleTime: 30_000,
    refetchInterval: pollMs,
    // Voltar à aba pelo dock mostra a lista na hora: o que já veio fica na tela enquanto a
    // revalidação corre, em vez de piscar vazia como uma recarga.
    placeholderData: keepPreviousData,
  });

  // Uma notificação agrupada muda de `createdAt` no servidor e pode reaparecer na página seguinte
  // já carregada: sem dedupe por id, a mesma linha aparecia duas vezes na lista.
  const seen = new Set<string>();
  const items: Notification[] = [];
  for (const page of list.data?.pages ?? []) {
    for (const notification of page.items) {
      if (seen.has(notification.id)) continue;
      seen.add(notification.id);
      items.push(notification);
    }
  }

  return {
    ...list,
    /** Every page fetched so far, flattened and deduplicated: what the full page lists. */
    items,
    /** Only the latest rows: what the bell previews, even after the page loaded further. */
    latest: list.data?.pages[0]?.items.slice(0, PREVIEW_SIZE) ?? [],
  };
}
