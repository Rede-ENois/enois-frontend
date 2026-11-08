import type { CallKind } from "./call-kind";
import type { CallModality } from "./call-modality";
import type { CallParticipantState } from "./call-participant-state";
import type { CallState } from "./call-state";

/** A chamada como o servidor conta para esta pessoa. Nunca carrega token nem nome de sala. */
export interface CallView {
  id: string;
  kind: CallKind;
  modality: CallModality;
  conversationId: string | null;
  groupId: string | null;
  /** Tópico do grupo quando a sala é do tópico; nulo na sala geral e em toda 1:1. */
  topicId: string | null;
  /** Encontro dono da sala "Tamo junto"; nulo nas chamadas de conversa e de grupo. */
  eventId: string | null;
  initiatorId: string;
  displayName: string;
  state: CallState;
  createdAt: string;
  answeredAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  expiresAt: string | null;
  participantCount: number;
  isInitiator: boolean;
  myState: CallParticipantState | null;
}
