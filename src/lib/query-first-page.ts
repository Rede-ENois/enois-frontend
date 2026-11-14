import type { Query, QueryClient } from "@tanstack/react-query";

import type { PageResponse } from "@/types/application/api/page-response";

/**
 * Busca só a PRIMEIRA página de uma consulta paginada por cursor, sem tocar no que já está no
 * cache. `fetchQuery`/`invalidateQueries` numa consulta infinita refazem TODAS as páginas
 * carregadas — com o histórico aberto isso é uma rajada de requisições e a lista inteira trocando
 * de uma vez. Aqui a função da consulta é chamada uma vez, com o cursor inicial.
 */
export async function fetchFirstPage<T>(
  queryClient: QueryClient,
  query: Query,
  pageParam?: unknown,
): Promise<PageResponse<T> | null> {
  const queryFn = query.options.queryFn;
  if (typeof queryFn !== "function") return null;
  // `initialPageParam` mora nas opções da consulta infinita, não no tipo genérico de `Query`.
  const initial = (query.options as { initialPageParam?: unknown }).initialPageParam;
  const controller = new AbortController();
  try {
    const page = await queryFn({
      client: queryClient,
      queryKey: query.queryKey,
      signal: controller.signal,
      meta: query.options.meta,
      pageParam: pageParam === undefined ? initial : pageParam,
      direction: "forward",
    });
    return isPage<T>(page) ? page : null;
  } catch {
    return null;
  }
}

function isPage<T>(value: unknown): value is PageResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    Array.isArray((value as { items: unknown }).items)
  );
}

/** Junta as linhas novas na frente das que já estavam, sem repetir id. */
export function mergeRows<T extends { id: string }>(fresh: T[], kept: T[]): T[] {
  const seen = new Set(fresh.map((row) => row.id));
  return [...fresh, ...kept.filter((row) => !seen.has(row.id))];
}

/**
 * Se a rodada de renovação ainda pode pôr as linhas novas na primeira página. Renovação várias
 * vezes seguidas (aviso, aviso, reconexão) chega fora de ordem: a resposta mais lenta traria de
 * volta a janela velha e repetiria o que a mais nova já tinha mostrado.
 */
export function isLatestRefresh(startedAt: number, latestStartedAt: number): boolean {
  return startedAt === latestStartedAt;
}
