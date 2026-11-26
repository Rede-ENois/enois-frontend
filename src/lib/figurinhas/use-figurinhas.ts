import { useMemo } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { FigurinhaAutor } from "@/types/application/figurinhas/figurinha-autor";
import type { FigurinhaComunidade } from "@/types/application/figurinhas/figurinha-comunidade";
import type { FigurinhaDoIndice } from "@/types/application/figurinhas/figurinha-do-indice";
import type { FigurinhaSugerida } from "@/types/application/figurinhas/figurinha-sugerida";
import type { FigurinhaComunidadeItem } from "@rede-enois/design-system/domain";

import { emoteImageUrl } from "@/lib/emotes/api";
import { filterEnoisEmojis } from "@/lib/emotes/enois-pack";
import { useEmotePage } from "@/lib/emotes/use-emotes";

import { figurinhasApi } from "./api";
import { codigosNoTexto } from "./autocomplete";
import { origemDoCodigo } from "./figurinha-origem";

/** O menu do `:` mostra o que cabe numa rolagem curta; quem quer mais abre o catálogo. */
export const FIGURINHAS_SUGERIDAS_MAX = 8;

/** A grade do catálogo: seis colunas em telas largas, o que cabe numa rolagem curta. */
export const FIGURINHAS_POR_PAGINA = 48;

const CINCO_MINUTOS = 5 * 60 * 1000;

/**
 * Resolve os códigos da comunidade que aparecem no texto.
 *
 * O pedido é só dos códigos presentes (`codigos`), nunca do catálogo inteiro: um post com uma
 * figurinha custa uma entrada, não uma lista. O índice é 1:1 com o que está ativo agora — quando
 * a figura é desativada, o índice deixa de devolvê-la e o texto volta a mostrar o código.
 */
export function useFigurinhasDoTexto(texto: string): Map<string, FigurinhaDoIndice> {
  const codigos = useMemo(() => codigosNoTexto(texto), [texto]);
  const { data } = useQuery({
    queryKey: ["figurinhas", "indice", codigos],
    queryFn: () => figurinhasApi.index(codigos),
    enabled: codigos.length > 0,
    staleTime: CINCO_MINUTOS,
    retry: 1,
  });

  return useMemo(() => {
    const mapa = new Map<string, FigurinhaDoIndice>();
    for (const [codigo, url] of Object.entries(data ?? {})) {
      const code = codigo.replace(/^:|:$/g, "");
      if (typeof url === "string" && url) mapa.set(code, { code, url, kind: origemDoCodigo(code) });
    }
    return mapa;
  }, [data]);
}

/** Uma página do catálogo (`/figurinhas?page&limit&q`): nome, código ou id, só as ativas. */
export function useFigurinhasPage(page: number, termo: string, aberto = true) {
  return useQuery({
    queryKey: ["figurinhas", "pagina", page, termo],
    queryFn: () => figurinhasApi.pagina(page, FIGURINHAS_POR_PAGINA, termo || undefined),
    enabled: aberto,
    placeholderData: keepPreviousData,
    staleTime: CINCO_MINUTOS,
    retry: 1,
  });
}

/**
 * Sugestões para o `:` do compositor: o pacote É Nóis (que o app já tem em memória, sem rede), o
 * catálogo oficial que o backend mantém em cache (`GET /emotes`) e o da comunidade
 * (`GET /figurinhas`), consultados com o mesmo termo. O oficial vem primeiro quando os dois têm o
 * mesmo código: é ele quem desenha o texto publicado.
 */
export function useFigurinhasSugeridas(
  termo: string,
  aberto: boolean,
): { opcoes: FigurinhaSugerida[]; carregando: boolean } {
  const oficial = useEmotePage(1, termo, aberto);
  const comunidade = useFigurinhasPage(1, termo, aberto);

  const opcoes = useMemo(() => {
    const vistas = new Set<string>();
    const lista: FigurinhaSugerida[] = [];
    const adicionar = (sugerida: FigurinhaSugerida) => {
      if (vistas.has(sugerida.code)) return;
      vistas.add(sugerida.code);
      lista.push(sugerida);
    };
    for (const emoji of filtrarEnois(termo)) {
      adicionar({ code: emoji.code, nome: emoji.code, url: emoji.src, kind: "ENOIS" });
    }
    for (const emote of oficial.data?.items ?? []) {
      adicionar({
        code: emote.code,
        nome: emote.code,
        url: emoteImageUrl(emote.thumb),
        kind: origemDoCodigo(emote.code),
      });
    }
    for (const figurinha of comunidade.data?.items ?? []) {
      const code = figurinha.codigo.replace(/^:|:$/g, "");
      adicionar({ code, nome: figurinha.nome, url: figurinha.imagem, kind: "COMUNIDADE" });
    }
    return lista.slice(0, FIGURINHAS_SUGERIDAS_MAX);
  }, [termo, oficial.data, comunidade.data]);

  return { opcoes, carregando: oficial.isLoading || comunidade.isLoading };
}

/** O pacote É Nóis filtrado pelo termo, no formato do menu. */
function filtrarEnois(termo: string) {
  if (!termo) return [];
  return filterEnoisEmojis(termo).map((item) => ({ code: item.code, src: item.src }));
}

/**
 * A página do catálogo virando cartões: o autor vem do mapa da resposta (o mesmo dono não se
 * repete por item) e as ações são só as que a pessoa na tela tem — entrar no texto, denunciar
 * qualquer uma, remover a própria.
 */
export function cartoesDoCatalogo({
  items,
  autores,
  autorId,
  aoUsar,
  aoDenunciar,
  aoRemover,
}: {
  items: readonly FigurinhaComunidade[];
  autores: Record<string, FigurinhaAutor>;
  autorId?: string;
  aoUsar?: (figurinha: FigurinhaComunidade) => void;
  aoDenunciar?: (figurinha: FigurinhaComunidade) => void;
  aoRemover?: (figurinha: FigurinhaComunidade) => void;
}): FigurinhaComunidadeItem[] {
  return items.map((figurinha) => {
    const autor = autores[figurinha.autorId];
    const meu = !!autorId && figurinha.autorId === autorId;
    return {
      id: figurinha.id,
      codigo: figurinha.codigo,
      nome: figurinha.nome,
      imagem: figurinha.imagem,
      autor: autor?.nome || autor?.username || texts.figurinhas.pagina.autorDesconhecido,
      onUsar: aoUsar && (() => aoUsar(figurinha)),
      onDenunciar: aoDenunciar && (() => aoDenunciar(figurinha)),
      onRemover: meu && aoRemover ? () => aoRemover(figurinha) : undefined,
    };
  });
}
