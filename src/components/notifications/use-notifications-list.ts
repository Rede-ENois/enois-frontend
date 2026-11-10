import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import type { InterfaceContext } from "@rede-enois/design-system/domain";

import { notificationsApi } from "@/lib/api";

/**
 * The one list of notices behind the bell and the full page, under a single query key: one fetch
 * per context, and whoever arrives second (the bell on desktop, the whole page on the phone)
 * reuses the cache instead of asking the server for a second copy. The key sits under
 * ["notifications"], so reading a row and the summary behind the menu signals invalidate together.
 */
export const PAGE_SIZE = 30;

/** How many rows the bell previews — its previous limit, sliced from the page it already has. */
export const PREVIEW_SIZE = 20;

export function useNotificationsList(context: InterfaceContext, enabled = true) {
  const list = useInfiniteQuery({
    queryKey: ["notifications", context],
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam, PAGE_SIZE, context),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    staleTime: 30_000,
    // Voltar à aba pelo dock mostra a lista na hora: o que já veio fica na tela enquanto a
    // revalidação corre, em vez de piscar vazia como uma recarga.
    placeholderData: keepPreviousData,
  });

  return {
    ...list,
    /** Every page fetched so far, flattened: what the full page lists. */
    items: list.data?.pages.flatMap((page) => page.items) ?? [],
    /** Only the latest rows: what the bell previews, even after the page loaded further. */
    latest: list.data?.pages[0]?.items.slice(0, PREVIEW_SIZE) ?? [],
  };
}
