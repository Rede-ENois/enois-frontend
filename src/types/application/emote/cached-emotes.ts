import type { GlobalEmote } from "./global-emote";

/** Catálogo guardado no navegador entre visitas: a lista e quando ela foi salva (epoch em ms). */
export type CachedEmotes = {
  emotes: GlobalEmote[];
  savedAt: number;
};
