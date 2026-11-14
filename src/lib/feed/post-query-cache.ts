import type { QueryClient } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { FeedPages } from "@/types/lib/feed/feed-pages";

import { fetchFirstPage, mergeRows } from "../query-first-page";

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
        if (items.length === first.items.length) return current;
        return { ...current, pages: [{ ...first, items }, ...older] };
      });
    }),
  );
}

/**
 * Apagou (ou o post saiu do feed): some de todas as páginas carregadas, sem pedir nada ao servidor.
 * A exclusão é lógica e reversível, então o post volta pelo mesmo caminho quando a pessoa desfaz.
 */
export function removePostFromFeedCache(queryClient: QueryClient, postId: string): void {
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
}

export function updatePostInQueryCache(
  queryClient: QueryClient,
  postId: string,
  update: (post: PostView) => PostView,
) {
  // O prefixo `["feed"]` alcança também as consultas vizinhas que não são páginas de feed
  // (`["feed","scheduled"]` guarda uma lista simples). Sem esta checagem, `pages` vinha
  // indefinido e o `.map` estourava DENTRO da atualização otimista — o efeito era a ação
  // morrer antes de falar com o servidor. Só mexe em quem realmente tem páginas.
  queryClient.setQueriesData<FeedPages>({ queryKey: ["feed"] }, (current) => {
    if (!current || !Array.isArray(current.pages)) return current;
    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        items: page.items.map((post) => (post.id === postId ? update(post) : post)),
      })),
    };
  });

  queryClient.setQueryData<PostView>(["post", postId], (post) =>
    post && post.id === postId ? update(post) : post,
  );
}
