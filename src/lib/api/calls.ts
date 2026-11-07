import type { CallJoin } from "@/types/application/call/call-join";
import type { CallKind } from "@/types/application/call/call-kind";
import type { CallReportInput } from "@/types/application/call/call-report-input";
import type { CallReportParticipant } from "@/types/application/call/call-report-participant";
import type { CallView } from "@/types/application/call/call-view";

import { api } from "../api-client";

/**
 * Chamadas: 1:1 na conversa e "Tamo junto" no grupo.
 *
 * Toda regra fica no servidor. Aqui só se pede e se mostra o que voltou — inclusive o token de
 * entrada, que já vem assinado e é usado direto no iframe do Jitsi.
 */
export const callsApi = {
  /** Começa (ou devolve) a chamada 1:1 da conversa. */
  startDirect: (conversationId: string, kind: CallKind) =>
    api.post<CallView>(`/conversations/${conversationId}/calls`, { kind }),

  /** Começa (ou devolve) o "Tamo junto" da sala geral do grupo. */
  startGroup: (groupId: string, kind: CallKind) =>
    api.post<CallView>(`/groups/${groupId}/calls`, { kind }),

  /** Começa (ou devolve) o "Tamo junto" do tópico: sala própria, independente da geral. */
  startTopicCall: (groupId: string, topicId: string, kind: CallKind) =>
    api.post<CallView>(`/groups/${groupId}/topics/${topicId}/calls`, { kind }),

  /** Chamada aberta do vínculo, se houver (`null` quando não há). */
  openOfConversation: (conversationId: string) =>
    api.get<CallView | null>(`/conversations/${conversationId}/calls/open`),

  openOfGroup: (groupId: string) => api.get<CallView | null>(`/groups/${groupId}/calls/open`),

  openOfTopic: (groupId: string, topicId: string) =>
    api.get<CallView | null>(`/groups/${groupId}/topics/${topicId}/calls/open`),

  /** Tudo que está aberto para a pessoa: é o que permite voltar de outra tela para a chamada. */
  open: () => api.get<CallView[]>("/calls/open"),

  get: (callId: string) => api.get<CallView>(`/calls/${callId}`),

  answer: (callId: string) => api.post<CallView>(`/calls/${callId}/answer`),
  decline: (callId: string) => api.post<CallView>(`/calls/${callId}/decline`),
  cancel: (callId: string) => api.post<CallView>(`/calls/${callId}/cancel`),
  /** Autoriza a entrada e devolve a credencial da sala. */
  join: (callId: string) => api.post<CallJoin>(`/calls/${callId}/join`),
  leave: (callId: string) => api.post<CallView>(`/calls/${callId}/leave`),
  end: (callId: string) => api.post<CallView>(`/calls/${callId}/end`),
  /** A tela perdeu a mídia: fecha explicitamente em vez de ficar pendurada. */
  fail: (callId: string) => api.post<CallView>(`/calls/${callId}/fail`),

  /**
   * Quem esteve na sala e pode ser apontado. A lista vem do servidor: quem não entrou não aparece,
   * e quem denuncia não aparece para si mesmo.
   */
  reportable: (callId: string) => api.get<CallReportParticipant[]>(`/calls/${callId}/reportable`),

  /** Denúncia da chamada com o relato e a captura do momento (quando houve). */
  report: (callId: string, data: CallReportInput) =>
    api.post<{ id: string; status: string }>(`/calls/${callId}/reports`, data),
};
