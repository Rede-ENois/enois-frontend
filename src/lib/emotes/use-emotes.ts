import { useMemo } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { emotesApi } from "./api";
import { applyEmotes, emoteIndex } from "./catalog";
import { loadCachedIndex, saveCachedIndex } from "./catalog-cache";

/**
 * Figurinhas por página: cabe na altura da grade e mantém a rede leve — cada página é uma leva de
 * miniaturas, não a coleção inteira (1.100 figurinhas de uma vez era o que demorava a abrir).
 */
export const EMOTES_POR_PAGINA = 40;

const SEIS_HORAS = 6 * 60 * 60 * 1000;
/** O backend guarda a página por 10 minutos; o cliente segue a mesma validade. */
const DEZ_MINUTOS = 10 * 60 * 1000;

const NO_ENTRIES: Record<string, string> = {};

// Shared by every RichText on screen: reading the localStorage copy (JSON.parse + validating each
// entry) and building the Map used to cost a full pass over the catalog PER post, comment and
// message mounted, which showed up as the hot path of the feed in a CPU profile.
let storedIndex: ReturnType<typeof loadCachedIndex> | undefined;
const indexByEntries = new WeakMap<Record<string, string>, Map<string, string>>();

/** The localStorage copy, read once per page load (it only seeds the first paint). */
function storedIndexOnce() {
  if (typeof window === "undefined") return null;
  if (storedIndex === undefined) storedIndex = loadCachedIndex();
  return storedIndex;
}

/** One Map per entries object: every component reading the same query data shares it. */
function sharedIndex(entries: Record<string, string>): Map<string, string> {
  let index = indexByEntries.get(entries);
  if (!index) {
    index = emoteIndex(entries);
    indexByEntries.set(entries, index);
  }
  return index;
}

/**
 * Índice código → imagem, para desenhar o texto dos posts.
 *
 * Uma busca por sessão: o backend serve o índice de memória, e a cópia do `localStorage` entra como
 * dado inicial para a primeira pintura já sair com figurinha, sem esperar rede. Se a busca falhar,
 * o texto continua saindo com o código cru — figurinha é enfeite, nunca bloqueio de leitura.
 */
export function useEmoteIndex(): Map<string, string> {
  const cached = storedIndexOnce();
  const { data } = useQuery({
    queryKey: ["emotes", "index"],
    queryFn: async () => {
      const resposta = await emotesApi.index();
      saveCachedIndex(resposta.entries);
      return resposta.entries;
    },
    initialData: cached?.entries,
    initialDataUpdatedAt: cached?.savedAt,
    staleTime: SEIS_HORAS,
    gcTime: SEIS_HORAS * 4,
    retry: 1,
  });

  return sharedIndex(data ?? NO_ENTRIES);
}

/** Texto com os códigos de figurinha já trocados pela imagem do nosso proxy. */
export function useEmoteText(content: string): string {
  const index = useEmoteIndex();
  return useMemo(() => applyEmotes(content, index), [content, index]);
}

/**
 * Uma página do seletor, buscada no backend (`page`, `limit`, `q`).
 *
 * `enabled` segura a busca enquanto o seletor está fechado: abrir a caixa de texto não custa
 * requisição. `placeholderData` mantém a página anterior na tela durante a troca — sem piscar
 * "Carregando figurinhas..." a cada clique em "próxima".
 */
export function useEmotePage(page: number, termo: string, aberto: boolean) {
  return useQuery({
    queryKey: ["emotes", "pagina", page, termo],
    queryFn: () => emotesApi.page(page, EMOTES_POR_PAGINA, termo || undefined),
    enabled: aberto,
    placeholderData: keepPreviousData,
    staleTime: DEZ_MINUTOS,
    retry: 1,
  });
}
