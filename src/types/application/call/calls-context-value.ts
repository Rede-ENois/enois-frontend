import type { CallKind } from "./call-kind";
import type { CallView } from "./call-view";

/** Ações da chamada disponíveis em qualquer tela (o provider central as implementa). */
export interface CallsContextValue {
  startDirect: (conversationId: string, kind: CallKind) => Promise<void>;
  startGroup: (groupId: string, kind: CallKind) => Promise<void>;
  answer: () => Promise<void>;
  decline: () => Promise<void>;
  /** Pede credencial ao servidor e abre a sala (usado por notificações e pelo banner do grupo). */
  open: (callId: string) => Promise<void>;
  close: () => void;
  call: CallView | null;
}
