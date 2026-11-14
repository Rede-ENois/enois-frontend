import { useEffect } from "react";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import type { PageResponse } from "@/types/application/api/page-response";
import type { PostView } from "@/types/application/feed/post-view";
import type { FeedLiveCursor } from "@/types/lib/feed/feed-live-cursor";
import type { FeedLiveScope } from "@/types/lib/feed/feed-live-scope";
import type { FeedLiveTally } from "@/types/lib/feed/feed-live-tally";
import type { FeedPages } from "@/types/lib/feed/feed-pages";

import { fetchFirstPage, mergeRows } from "../query-first-page";

/**
 * Mantém o feed que está na tela em dia sem trocar a lista.
 *
 * O feed carrega 10 posts por página, e o topo do feed tem posts novos o tempo todo. Refazer a
 * primeira página sozinho (era `refetchInterval` de 30s e `refetchOnWindowFocus` em toda aba)
 * reescrevia a janela do topo embaixo de quem estava lendo: os cartões se deslocavam e a lista
 * reordenava. Aqui a consulta não é refeita pelo react-query: a varredura busca uma página por
 * vez — as mais novas que ainda não foram conferidas — usando a própria função da consulta, e
 * junta o que voltou por id.
 *
 * O que muda na tela: post novo no topo continua esperando a pessoa voltar para o topo (o aviso
 * de "novos posts" é de `useFeedArrivals`, alimentado por um `refetch` explícito); post apagado,
 * ou que saiu do feed pela regra do servidor, sai da lista; a ordem dentro da página é a do
 * servidor.
 */

/** Intervalo entre uma varredura e a seguinte. */
export const FEED_LIVE_REFRESH_MS = 60_000;

/** Quantas páginas uma varredura confere. O feed pode ter dezenas carregadas. */
const PAGES_PER_SWEEP = 2;

/** Varreduras em andamento, por consulta: a próxima espera a anterior. */
const running = new Set<string>();

function startFeedLiveTally(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  cursor: FeedLiveCursor,
): FeedLiveTally {
  const query = queryClient.getQueryCache().find({ queryKey, exact: true });
  const tally: FeedLiveTally = { pending: Promise.resolve(null), settled: null };
  if (!query) return tally;
  // A função é a da própria consulta: ela conhece o tamanho da página (inclusive no modo lite),
  // então o recorte conferido é o mesmo de quando a página foi carregada.
  tally.pending = fetchFirstPage<PostView>(queryClient, query, cursor).then((page) => {
    tally.settled = page;
    return page;
  });
  return tally;
}

/**
 * Confere as páginas ainda não conferidas desta varredura, da mais nova para a mais antiga, e
 * devolve o que veio. O cursor de cada página vem de `pageParams` — o mesmo que a tela usou.
 */
async function sweepLoadedPages(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  tally: Map<FeedLiveCursor, FeedLiveTally>,
): Promise<void> {
  const snapshot = queryClient.getQueryData<FeedPages>(queryKey);
  if (!snapshot || !Array.isArray(snapshot.pages) || snapshot.pages.length === 0) return;

  const pending: FeedLiveCursor[] = [];
  for (let index = 0; index < snapshot.pages.length; index++) {
    const cursor = (snapshot.pageParams[index] as FeedLiveCursor) ?? null;
    if (!tally.has(cursor)) {
      tally.set(cursor, startFeedLiveTally(queryClient, queryKey, cursor));
      pending.push(cursor);
    }
    if (pending.length === PAGES_PER_SWEEP) break;
  }
  if (pending.length === 0) return;

  await Promise.all(pending.map((cursor) => tally.get(cursor)?.pending));
}

/**
 * Põe no cache o que a varredura trouxe, por id, sem mexer no resto. A primeira página mantém o
 * `lastSeenAt` que já está na tela: é o marcador "Você está em dia" desta visita.
 */
function mergeSweptPages(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  tally: Map<FeedLiveCursor, FeedLiveTally>,
): boolean {
  let changed = false;
  queryClient.setQueryData<FeedPages>(queryKey, (current) => {
    if (!current || !Array.isArray(current.pages)) return current;
    const pages = current.pages.map((page, index) => {
      const cursor = (current.pageParams[index] as FeedLiveCursor) ?? null;
      const fresh = tally.get(cursor)?.settled;
      if (!fresh) return page;
      const items = mergeRows(fresh.items, page.items);
      if (items.length === page.items.length) return page;
      changed = true;
      return { ...page, items };
    });
    return changed ? { ...current, pages } : current;
  });
  return changed;
}

/**
 * Varredura de fundo do feed aberto. Chamar com a consulta que a tela está lendo; roda só em aba
 * visível e só sobre o que já foi carregado — não existe página "a mais" aqui.
 */
export function useFeedLiveRefresh({ queryClient, queryKey, enabled }: FeedLiveScope) {
  const serialized = JSON.stringify(queryKey);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof document === "undefined") return;

    // A mesma chave serializada dá a mesma consulta: a dependência é o conteúdo, não a identidade.
    const key = JSON.parse(serialized) as unknown[];
    const scope = `feed:${serialized}`;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sweep = async () => {
      if (stopped) return;
      if (document.visibilityState === "visible" && !running.has(scope)) {
        running.add(scope);
        const tally = new Map<FeedLiveCursor, FeedLiveTally>();
        try {
          await sweepLoadedPages(queryClient, key, tally);
          if (!stopped) mergeSweptPages(queryClient, key, tally);
        } finally {
          running.delete(scope);
        }
      }
      if (!stopped) timer = setTimeout(sweep, FEED_LIVE_REFRESH_MS);
    };

    // O primeiro passo é adiado: no mount a consulta ainda está carregando a primeira página.
    timer = setTimeout(sweep, FEED_LIVE_REFRESH_MS);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      void sweep();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [queryClient, serialized, enabled]);
}
