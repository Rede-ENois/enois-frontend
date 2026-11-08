import type { CallKind } from "./call-kind";
import type { CallView } from "./call-view";

/** Ações da chamada disponíveis em qualquer tela (o provider central as implementa). */
export interface CallsContextValue {
  startDirect: (conversationId: string, kind: CallKind) => Promise<void>;
  /** Sala geral do grupo, ou a sala do tópico quando `topicId` vem preenchido. */
  startGroup: (groupId: string, kind: CallKind, topicId?: string) => Promise<void>;
  /** Sala "Tamo junto" do encontro: aberta a quem quiser entrar. */
  startEvent: (eventId: string, kind: CallKind) => Promise<void>;
  /** Sem id, atende a chamada da tela; com id, atende a que está na fila. */
  answer: (callId?: string) => Promise<void>;
  /** Sem id, recusa a chamada da tela; com id, recusa a que está na fila. */
  decline: (callId?: string) => Promise<void>;
  /** Pede credencial ao servidor e abre a sala (usado por notificações e pelo banner do grupo). */
  open: (callId: string) => Promise<void>;
  /**
   * A pessoa saiu pela própria sala (desligou dentro do iframe). Fecha o painel, avisa o servidor
   * e não reabre: a sala que ela encerrou não volta para a tela.
   */
  leaveFromRoom: (callId: string, reason?: string) => Promise<void>;
  close: () => void;
  call: CallView | null;
}
