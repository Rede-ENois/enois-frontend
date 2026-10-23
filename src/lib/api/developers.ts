import type { DeveloperOrigin } from "@/types/application/developers/developer-origin";

import { api } from "../api-client";

/** Origens autorizadas a chamar a API pública (/v1) a partir do navegador. */
export const developerOriginsApi = {
  list: () => api.get<DeveloperOrigin[]>("/developers/origins"),

  add: (origin: string) => api.post<DeveloperOrigin>("/developers/origins", { origin }),

  remove: (id: string) => api.delete<void>(`/developers/origins/${id}`),
};
