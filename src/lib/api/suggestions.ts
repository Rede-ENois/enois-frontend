import type { SuggestionAdminView } from "@/types/application/suggestion/suggestion-admin-view";
import type { SuggestionInput } from "@/types/application/suggestion/suggestion-input";
import type { SuggestionStatus } from "@/types/application/suggestion/suggestion-status";
import type { SuggestionView } from "@/types/application/suggestion/suggestion-view";

import { api, buildQuery } from "../api-client";

export const suggestionsApi = {
  /** Envia uma sugestão: fica pendente até um moderador aprovar. */
  submit: (data: SuggestionInput) => api.post<SuggestionView>("/suggestions", data),

  /** Histórico de quem enviou (a issue pública só aparece depois da aprovação). */
  mine: (limit = 20) => api.get<SuggestionView[]>(`/suggestions/mine?limit=${limit}`),

  /** Fila do painel de moderação. */
  adminList: (params: { status?: SuggestionStatus; limit?: number } = {}) =>
    api.get<SuggestionAdminView[]>(`/admin/suggestions${buildQuery(params)}`),

  /** Aprova e abre a issue pública no repositório do destino. */
  approve: (id: string) =>
    api.post<SuggestionAdminView>(`/admin/suggestions/${encodeURIComponent(id)}/approve`, {}),

  reject: (id: string) =>
    api.post<SuggestionAdminView>(`/admin/suggestions/${encodeURIComponent(id)}/reject`, {}),
};
