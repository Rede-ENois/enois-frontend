import type { QueryClient } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { FeedPages } from "@/types/lib/feed/feed-pages";
import type { HomeTab } from "@/types/routes/feed/home-tab";

import { fetchFirstPage, mergeRows } from "../query-first-page";

export function feedQueryKey(tab: HomeTab, typeFilter?: string, resolved?: boolean) {
  return ["feed", tab, typeFilter ?? "", resolved ?? ""] as const;
}

/**
 * Aba "Ainda não vi": o servidor deixa de mandar o post assim que ele tem reação ou comentário
 * meus, então qualquer revalidação o tira da tela na hora. Nesta aba a pessoa está lendo — a saída
 * vale para a próxima visita, não para o instante em que ela reagiu (issue #559).
 *
 * O que muda numa reação é contador e resumo, e isso o cache já recebeu na hora
 * (`updatePostInQueryCache`), então pular a revalidação não deixa nada desatualizado na tela.
 *
 * A forma da chave vem de `useFeed` (`src/routes/feed.tsx`): `["feed", tab, typeFilter, resolved]`.
 */
export function isUnseenFeedQuery(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "feed" && queryKey[1] === "UNSEEN";
}

/**
 * Quando a lista do feed se renova sozinha: nunca, por conta do react-query.
 *
 * `refetchInterval` e `refetchOnWindowFocus` refazem a consulta inteira — todas as páginas
 * carregadas — e reescrevem a primeira página com uma janela nova. Com 10 posts por página isso
 * deslocava os cartões embaixo de quem estava lendo, e cada volta de foco na janela era uma rajada
 * de requisições. Quem mantém o feed em dia é a varredura de `feed-live.ts`, que confere uma
 * página por vez e junta por id, sem trocar a lista.
 */
export function feedRefreshOptions(_tab: string): {
  refetchInterval: number | false;
  refetchOnWindowFocus: boolean;
} {
  return { refetchInterval: false, refetchOnWindowFocus: false };
}

/** Consultas de página do feed que estão na tela. */
function visibleFeedQueries(queryClient: QueryClient) {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ["feed"] })
    .filter((query) => query.getObserversCount() > 0)
    .filter((query) => Array.isArray((query.state.data as { pages?: unknown } | undefined)?.pages));
}

/**
 * Publicou algo: a primeira página de cada feed na tela ganha o post novo no topo, e as páginas
 * que a pessoa já carregou ficam onde estão. Antes, `invalidateQueries(["feed"])` refazia todas as
 * páginas de todas as abas abertas para mostrar um post que só entra no topo.
 */
export async function refreshFeedFirstPage(queryClient: QueryClient): Promise<void> {
  await Promise.all(
    visibleFeedQueries(queryClient).map(async (query) => {
      const fresh = await fetchFirstPage<PostView>(queryClient, query);
      if (!fresh) return;
      queryClient.setQueryData<FeedPages>(query.queryKey, (current) => {
        if (!current || !Array.isArray(current.pages) || current.pages.length === 0) return current;
        const [first, ...older] = current.pages;
        const items = mergeRows(fresh.items, first.items);
        const freshIds = new Set(fresh.items.map((post) => post.id));
        const olderPages = older.map((page) => {
          const items = page.items.filter((post) => !freshIds.has(post.id));
          return items.length === page.items.length ? page : { ...page, items };
        });
        return { ...current, pages: [{ ...first, items }, ...olderPages] };
      });
    }),
  );
}

/**
 * Apagou (ou o post saiu do feed): some de todas as páginas carregadas, sem pedir nada ao servidor.
 * O retorno desfaz a remoção sem substituir os dados atuais dos outros posts.
 */
export function removePostFromFeedCache(queryClient: QueryClient, postId: string) {
  const snapshot = queryClient.getQueriesData<FeedPages>({ queryKey: ["feed"] });
  queryClient.setQueriesData<FeedPages>({ queryKey: ["feed"] }, (current) => {
    if (!current || !Array.isArray(current.pages)) return current;
    let changed = false;
    const pages = current.pages.map((page) => {
      const items = page.items.filter((post) => post.id !== postId);
      if (items.length === page.items.length) return page;
      changed = true;
      return { ...page, items };
    });
    return changed ? { ...current, pages } : current;
  });

  return (restored: PostView) => {
    updatePostInQueryCache(queryClient, postId, () => restored);
    for (const [key, saved] of snapshot) {
      queryClient.setQueryData<FeedPages>(key, (current) => {
        if (!current || !Array.isArray(current.pages)) return current;
        if (current.pages.some((page) => page.items.some((p) => p.id === postId))) return current;
        const pages = current.pages.map((page, index) => {
          const oldPage = saved?.pages?.[saved.pageParams.indexOf(current.pageParams[index])];
          const position = oldPage?.items.findIndex((post) => post.id === postId) ?? -1;
          if (position < 0) return page;
          return {
            ...page,
            items: mergeRows([...page.items.slice(0, position), restored], page.items),
          };
        });
        return { ...current, pages };
      });
    }
  };
}

function isMatchingPost(value: unknown, postId: string): value is PostView {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { id?: unknown; counters?: unknown };
  return (
    candidate.id === postId && typeof candidate.counters === "object" && candidate.counters !== null
  );
}

function updatePostEntry(
  entry: unknown,
  postId: string,
  update: (post: PostView) => PostView,
): { next: unknown; changed: boolean } {
  if (isMatchingPost(entry, postId)) {
    return { next: update(entry), changed: true };
  }
  if (entry && typeof entry === "object" && "post" in entry) {
    const wrapper = entry as { post: unknown };
    if (isMatchingPost(wrapper.post, postId)) {
      return { next: { ...wrapper, post: update(wrapper.post) }, changed: true };
    }
  }
  return { next: entry, changed: false };
}

function updateItemsArray(
  items: unknown[],
  postId: string,
  update: (post: PostView) => PostView,
): { next: unknown[]; changed: boolean } {
  let changed = false;
  const next = items.map((item) => {
    const result = updatePostEntry(item, postId, update);
    if (result.changed) changed = true;
    return result.next;
  });
  return { next: changed ? next : items, changed };
}

export function updatePostInQueryCache(
  queryClient: QueryClient,
  postId: string,
  update: (post: PostView) => PostView,
) {
  // Atualiza o post em qualquer consulta em cache (feed principal, comunidades, canais, salvos,
  // coleções, murais, perfil corporativo ou post isolado), preservando a referência quando nada mudou.
  queryClient.setQueriesData<unknown>({}, (current: unknown) => {
    if (!current || typeof current !== "object") return current;

    if (isMatchingPost(current, postId)) {
      return update(current);
    }

    const record = current as { pages?: unknown; items?: unknown };

    if (Array.isArray(record.pages)) {
      let pagesChanged = false;
      const pages = record.pages.map((page) => {
        if (
          !page ||
          typeof page !== "object" ||
          !Array.isArray((page as { items?: unknown }).items)
        ) {
          return page;
        }
        const pageObj = page as { items: unknown[] };
        const { next, changed } = updateItemsArray(pageObj.items, postId, update);
        if (!changed) return page;
        pagesChanged = true;
        return { ...pageObj, items: next };
      });
      return pagesChanged ? { ...record, pages } : current;
    }

    if (Array.isArray(record.items)) {
      const { next, changed } = updateItemsArray(record.items, postId, update);
      return changed ? { ...record, items: next } : current;
    }

    return current;
  });
}
