import { useQuery } from "@tanstack/react-query";

import { AuthHero as AuthHeroView } from "@rede-enois/design-system/domain";

import { statsApi } from "@/lib/api/stats";

/**
 * Painel de marca das telas de entrada (login e reset de senha).
 *
 * Os numeros sao REAIS: vem de `/stats/community` (publico, agregado, cache de ~10 min no
 * servidor) — a mesma fonte que a landing usa. Se a consulta falhar, o painel fica sem numero em
 * vez de voltar a inventar um.
 */
export function AuthHero() {
  const { data: communityStats } = useQuery({
    queryKey: ["stats", "community"],
    queryFn: () => statsApi.community(),
    staleTime: 10 * 60_000,
    retry: 1,
  });

  return <AuthHeroView stats={communityStats} />;
}
