import type { CreateFreelanceInput } from "@/types/application/freelance/create-freelance-input";
import type { FreelancePage } from "@/types/application/freelance/freelance-page";
import type { FreelanceView } from "@/types/application/freelance/freelance-view";

import { api, buildQuery } from "../api-client";

export const freelancesApi = {
  list: (params: { limit?: number; cursor?: string | null; q?: string } = {}) =>
    api.get<FreelancePage>(`/freelances${buildQuery(params)}`),
  mine: () => api.get<FreelanceView[]>("/me/freelances"),
  create: (data: CreateFreelanceInput) => api.post<FreelanceView>("/freelances", data),
  /** Proposta: sai da identidade profissional e abre (ou reaproveita) a conversa profissional. */
  propose: (id: string, message: string) =>
    api.post<{ conversationId: string }>(`/freelances/${encodeURIComponent(id)}/proposals`, {
      message,
    }),
  /** Owner only: same body as the creation. A closed freelance is refused by the backend. */
  update: (id: string, data: CreateFreelanceInput) =>
    api.patch<FreelanceView>(`/freelances/${encodeURIComponent(id)}`, data),
  /** Owner only: removes the freelance. */
  remove: (id: string) =>
    api.delete<{ id: string; status: string }>(`/freelances/${encodeURIComponent(id)}`),
  close: (id: string) =>
    api.post<{ id: string; status: string }>(`/freelances/${encodeURIComponent(id)}/close`, {}),
};
