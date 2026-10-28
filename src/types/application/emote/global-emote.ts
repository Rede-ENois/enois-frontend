import type { EmoteProvider } from "./emote-provider";

/**
 * Figurinha de uma coleção GLOBAL (BTTV/FFZ). O `code` é o que a pessoa escreve no texto —
 * `KEKW` — e o `url` é a imagem que entra no chat: estática em 2x, ou animada quando o provedor
 * publica a versão em movimento.
 *
 * O `preview` é a miniatura da grade do seletor (escala 1x): mesma figurinha, uma fração do peso.
 * Carregar a grade com a imagem grande é o que deixava o seletor lento.
 */
export type GlobalEmote = {
  code: string;
  url: string;
  preview: string;
  provider: EmoteProvider;
};
