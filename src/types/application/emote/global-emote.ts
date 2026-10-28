import type { EmoteProvider } from "./emote-provider";

/**
 * Figurinha de uma coleção GLOBAL (BTTV/FFZ). O `code` é o que a pessoa escreve no texto —
 * `KEKW` — e o `url` é a imagem do CDN do provedor.
 */
export type GlobalEmote = {
  code: string;
  url: string;
  provider: EmoteProvider;
};
