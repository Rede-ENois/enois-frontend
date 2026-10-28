import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { applyEmotes, emoteIndex, fetchGlobalEmotes } from "./catalog";

const SEIS_HORAS = 6 * 60 * 60 * 1000;

/** Catálogo global de figurinhas; uma busca por sessão (o provedor muda pouco). */
export function useGlobalEmotes() {
  return useQuery({
    queryKey: ["emotes", "global"],
    queryFn: ({ signal }) => fetchGlobalEmotes(signal),
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
