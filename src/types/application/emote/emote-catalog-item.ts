import type { EmoteProvider } from "./emote-provider";

/**
 * Uma figurinha como o BACKEND a serve: o `code` que entra no texto (`KEKW`), a coleção de origem e
 * os dois caminhos de imagem do nosso proxy — `thumb` desenha a grade do seletor, `image` desenha a
 * figurinha no texto (animada quando o provedor publica a versão em movimento).
 *
 * Os caminhos são relativos à API (`/emotes/image/...`), porque é o backend quem sabe qual arquivo
 * pedir de qual CDN; quem transforma em URL completa é o cliente (`emoteImageUrl`).
 */
export type EmoteCatalogItem = {
  code: string;
  provider: EmoteProvider;
  id: string;
  animated: boolean;
  /** Posição na lista de mais usadas (1 é a mais usada); `null` para quem não é popular. */
  popularRank: number | null;
  image: string;
  thumb: string;
};
