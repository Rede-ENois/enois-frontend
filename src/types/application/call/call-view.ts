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
