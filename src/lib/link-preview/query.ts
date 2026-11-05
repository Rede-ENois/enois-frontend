import { queryOptions } from "@tanstack/react-query";

import type { LinkPreview } from "@/types/application/link-preview/link-preview";

import { linkPreviewsApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";

/**
 * Miniatura do link, por endereço.
 *
 * O backend tem o próprio cache (30 min); aqui a espera é mais curta porque o card reaparece a cada
 * rolagem do feed e a mesma chave já vem da memória. A chave desempata pelo leitor quando há sessão:
 * a página interna de um canal privado não volta do cache de quem não é membro.
 */
export function linkPreviewQueryOptions(url: string) {
  return queryOptions({
    queryKey: ["link-preview", url, getCurrentUser()?.id ?? "anon"] as const,
    queryFn: async (): Promise<LinkPreview | null> => {
      try {
        const response = await linkPreviewsApi.get(url);
        return response.preview ?? null;
      } catch {
        // Site fora do ar, limite de requisições: o post continua sem cartão. O link em si não
        // depende disto — quem estiver sem prévia ainda abre a página pelo texto.
        return null;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}
