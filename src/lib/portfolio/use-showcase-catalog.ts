import { useInfiniteQuery } from "@tanstack/react-query";

import type { PortfolioShowcaseSummary } from "@/types/application/portfolio/portfolio-showcase-summary";

import { portfolioApi } from "@/lib/api";

export const SHOWCASES_PAGE_SIZE = 12;

/**
 * As vitrines no ar para o Explorar, página a página pelo cursor do servidor. A de quem está lendo
 * vem junto quando está no ar — a seção tira a dela do fim da lista, comparando o username.
 */
export function useShowcaseCatalog() {
  const query = useInfiniteQuery({
    queryKey: ["portfolio-showcases"],
    queryFn: ({ pageParam }) => portfolioApi.list(pageParam, SHOWCASES_PAGE_SIZE),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });

  const seen = new Set<string>();
  const showcases: PortfolioShowcaseSummary[] = [];
  for (const page of query.data?.pages ?? []) {
    for (const showcase of page.items) {
      // Publicar enquanto a lista carrega move a vitrine para o topo e pode repeti-la numa página
      // seguinte: o resumo publicado novo não repete o que já está na tela.
      const key = `${showcase.publishedAt}|${showcase.username}`;
      if (seen.has(key)) continue;
      seen.add(key);
      showcases.push(showcase);
    }
  }

  return { ...query, showcases };
}
