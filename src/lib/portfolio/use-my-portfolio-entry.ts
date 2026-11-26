import { useQuery } from "@tanstack/react-query";

import { portfolioApi, profileApi } from "@/lib/api";
import { portfolioEntryOf } from "@/lib/portfolio/portfolio-teaser";

/**
 * A própria vitrine lida como uma visita: a mesma consulta para a entrada do feed e o Explorar, e
 * a mesma chave para que publicar no editor atualize as duas. Só o 404 (ainda não publicada) vira
 * `unpublished`; as demais falhas continuam erro, para a tela mostrar o "tentar de novo".
 */
export function useMyPortfolioEntry() {
  return useQuery({
    queryKey: ["portfolio-entry"],
    queryFn: async () => {
      const profile = await profileApi.me();
      return portfolioEntryOf(() => portfolioApi.byUsername(profile.username), profile);
    },
    staleTime: 60_000,
  });
}
