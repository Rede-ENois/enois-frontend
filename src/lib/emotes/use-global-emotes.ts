import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { applyEmotes, emoteIndex, fetchGlobalEmotes } from "./catalog";
import { loadCachedEmotes, saveCachedEmotes } from "./catalog-cache";

const SEIS_HORAS = 6 * 60 * 60 * 1000;

/**
 * Catálogo global de figurinhas; uma busca por sessão (o provedor muda pouco).
 *
 * A cópia do `localStorage` entra como dado inicial: o chat já desenha as figurinhas — e o seletor
 * abre cheio — no primeiro quadro, sem esperar a API de terceiro. A busca continua rodando em
 * segundo plano e atualiza a cópia quando passa da validade.
 */
export function useGlobalEmotes() {
  const cached = useMemo(() => loadCachedEmotes(), []);
  return useQuery({
    queryKey: ["emotes", "global"],
    queryFn: async ({ signal }) => {
      const emotes = await fetchGlobalEmotes(signal);
      saveCachedEmotes(emotes);
      return emotes;
    },
    initialData: cached?.emotes,
    initialDataUpdatedAt: cached?.savedAt,
    staleTime: SEIS_HORAS,
    gcTime: SEIS_HORAS * 4,
    retry: 1,
  });
}

/**
 * Texto com os códigos de figurinha já trocados pela imagem. Enquanto o catálogo não chegou (ou se
 * os dois provedores caírem), devolve o texto original — o código aparece como texto, sem erro.
 */
export function useEmoteText(content: string): string {
  const { data } = useGlobalEmotes();
  const index = useMemo(() => emoteIndex(data ?? []), [data]);
  return useMemo(() => applyEmotes(content, index), [content, index]);
}
