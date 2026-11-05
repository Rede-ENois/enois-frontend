import type { LinkPreviewResponse } from "@/types/application/link-preview/link-preview-response";

import { api, buildQuery } from "../api-client";

/**
 * Miniatura de link. Leitura pública (o post é público, inclusive quando aberto por quem não tem
 * sessão) e cacheada no servidor: o mesmo endereço não é buscado de novo a cada card.
 */
export const linkPreviewsApi = {
  get: (url: string) => api.get<LinkPreviewResponse>(`/link-preview${buildQuery({ url })}`),
};
