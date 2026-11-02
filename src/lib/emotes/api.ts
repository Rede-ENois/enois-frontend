import type { EmoteCatalogPage } from "@/types/application/emote/emote-catalog-page";
import type { EmoteIndexResponse } from "@/types/application/emote/emote-index-response";

import { api, apiUrl, buildQuery } from "@/lib/api-client";

/**
 * Endereço absoluto de uma imagem do catálogo.
 *
 * O backend devolve o caminho (`/emotes/image/FFZ/720564?variant=full`), porque o proxy é dele —
 * pedir a imagem direto ao CDN do provedor é o que fazia figurinha não carregar. Em produção a API
 * mora em outro host, então o caminho só vira URL completa passando pelo `apiUrl`.
 */
export function emoteImageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return apiUrl(path);
}

/**
 * Catálogo de figurinhas do site. Quem fala com o BTTV e o FrankerFaceZ é o backend, de 3 em 3
 * horas; aqui só se lê o resultado, já montado e em memória do outro lado.
 */
export const emotesApi = {
  page: (page: number, limit: number, query?: string) =>
    api.get<EmoteCatalogPage>(`/emotes${buildQuery({ page, limit, q: query })}`),

  index: () => api.get<EmoteIndexResponse>("/emotes/index"),
};
