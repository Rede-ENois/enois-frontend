import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import type { Notification } from "@/types/application/notification/notification";
import type { InterfaceContext } from "@rede-enois/design-system/domain";

import { notificationsApi } from "@/lib/api";
import { useInboxPollInterval } from "@/lib/message-stream";
import { useLiteMode } from "@/lib/use-lite-mode";

/**
 * The notices behind the bell and the full page come from two lists, one per tab of the panel:
 * - "Novas" is fed by the unread-first list (`unreadFirst=true`), so an unread notice is never
 *   stuck on a page nobody loads because newer read notices filled the first one (issue #1147);
 * - "Histórico" is fed by the recent list (arrival order), so someone with ten or more unread
 *   notices still sees the read ones.
 * The panel receives the union of both and splits the tabs by `read` itself. Each list has a
 * single query key, so whoever arrives second (the bell on desktop, the whole page on the phone)
 * reuses the cache instead of asking the server again. Both keys sit under ["notifications"], so
 * reading a row and the summary behind the menu signals invalidate together.
 */
export const PAGE_SIZE = 10;

/** How many rows of each list the bell previews — sliced from the page it already has. */
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

  const shared = {
    initialPageParam: null as string | null,
    getNextPageParam: (last: { nextCursor?: string | null }) => last.nextCursor ?? undefined,
    enabled,
    staleTime: 30_000,
    refetchInterval: pollMs,
    // Voltar à aba pelo dock mostra a lista na hora: o que já veio fica na tela enquanto a
    // revalidação corre, em vez de piscar vazia como uma recarga.
    placeholderData: keepPreviousData,
  };

  const recent = useInfiniteQuery({
    ...shared,
    queryKey: ["notifications", context, "recent"],
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam, PAGE_SIZE, context),
  });

  const unreadFirst = useInfiniteQuery({
    ...shared,
    queryKey: ["notifications", context, "unread-first"],
    queryFn: ({ pageParam }) =>
      notificationsApi.list(pageParam, PAGE_SIZE, context, { unreadFirst: true }),
    // O cursor desta lista é uma posição: quando um aviso carregado muda de grupo (é lido), as
    // linhas seguintes andam uma posição. A renovação (`inbox-sync`) refaz todas as páginas dela.
    meta: { positionCursor: true },
  });

  const lists = [recent, unreadFirst];

  return {
    /** Every page fetched so far from both lists, merged: what the full page lists. */
    items: mergeNotices(lists.flatMap((list) => list.data?.pages.map((page) => page.items) ?? [])),
    /** Only the first page of each list: what the bell previews, even after the page loaded further. */
    latest: mergeNotices(
      lists.map((list) => list.data?.pages[0]?.items.slice(0, PREVIEW_SIZE) ?? []),
    ),
    hasNextPage: lists.some((list) => list.hasNextPage),
    isFetching: lists.some((list) => list.isFetching),
    isFetchingNextPage: lists.some((list) => list.isFetchingNextPage),
    // O frontend não sabe qual aba do painel está aberta: "Carregar mais" avança as duas listas.
    fetchNextPage: () =>
      Promise.all(lists.filter((list) => list.hasNextPage).map((list) => list.fetchNextPage())),
    refetch: () => Promise.all(lists.map((list) => list.refetch())),
  };
}

/**
 * Union of the pages of both lists, newest first, for the panel's grouping by day:
 * - one row per id — a grouped notice changes `createdAt` on the server and can come back on a
 *   later page, and the same notice can sit in both lists;
 * - read wins: the same id read in one list and unread in the other was read (reading is
 *   irreversible; the only way back is the rollback in `markReadInCache`, which restores both).
 */
function mergeNotices(pages: Notification[][]): Notification[] {
  const byId = new Map<string, Notification>();
  for (const page of pages) {
    for (const notice of page) {
      const known = byId.get(notice.id);
      if (!known || (notice.read && !known.read)) byId.set(notice.id, notice);
    }
  }
  return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
