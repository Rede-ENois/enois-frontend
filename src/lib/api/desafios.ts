import type { DesafioParticipacaoView } from "@/types/application/desafios/desafio-participacao-view";
import type { DesafioView } from "@/types/application/desafios/desafio-view";
import type { DesafiosPage } from "@/types/application/desafios/desafios-page";
import type { DesafiosParticipacoesPage } from "@/types/application/desafios/desafios-participacoes-page";
import type { ParticipateDesafioInput } from "@/types/application/desafios/participate-desafio-input";
import type { PublishDesafioInput } from "@/types/application/desafios/publish-desafio-input";

import { api, buildQuery } from "../api-client";

/**
 * Desafios: convites nominais do Explorar — alguém convoca, a comunidade responde no mural e
 * quem convocou encerra reconhecendo UMA participação. Sem ranking e sem prêmio. Espaço só
 * dele: nada daqui aparece no feed Tudo, no perfil ou na busca. Toda escrita carrega chave de
 * idempotência (o api-client adiciona sozinho).
 */
export const desafiosApi = {
  feed: (cursor?: string | null, limit = 24) =>
    api.get<DesafiosPage>(`/desafios${buildQuery({ cursor, limit })}`),

  desafio: (desafioId: string) =>
    api.get<DesafioView>(`/desafios/${encodeURIComponent(desafioId)}`),

  participacoes: (desafioId: string) =>
    api.get<DesafiosParticipacoesPage>(`/desafios/${encodeURIComponent(desafioId)}/participacoes`),

  publish: (data: PublishDesafioInput) => api.post<DesafioView>("/desafios", data),

  close: (desafioId: string, destaqueId: string) =>
    api.post<DesafioView>(`/desafios/${encodeURIComponent(desafioId)}/fechamento`, { destaqueId }),

  remove: (desafioId: string) =>
    api.delete<{ removed: boolean }>(`/desafios/${encodeURIComponent(desafioId)}`),

  participate: (desafioId: string, data: ParticipateDesafioInput) =>
    api.post<DesafioParticipacaoView>(
      `/desafios/${encodeURIComponent(desafioId)}/participacoes`,
      data,
    ),

  removeParticipacao: (desafioId: string, participacaoId: string) =>
    api.delete<{ removed: boolean }>(
      `/desafios/${encodeURIComponent(desafioId)}/participacoes/${encodeURIComponent(participacaoId)}`,
    ),

  cheer: (participacaoId: string) =>
    api.post<DesafioParticipacaoView>(
      `/desafios/participacoes/${encodeURIComponent(participacaoId)}/torcidas`,
    ),

  uncheer: (participacaoId: string) =>
    api.delete<{ removed: boolean }>(
      `/desafios/participacoes/${encodeURIComponent(participacaoId)}/torcidas`,
    ),
};
