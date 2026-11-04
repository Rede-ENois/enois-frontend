import type { CallJoin } from "./call-join";
import type { CallPhase } from "./call-phase";
import type { CallView } from "./call-view";

/** A chamada aberta nesta aba: o painel desenha exatamente isto. */
export interface CallSessionState {
  phase: CallPhase;
  call: CallView | null;
  join: CallJoin | null;
  minimized: boolean;
  error: string | null;
  /** O painel está aberto mas o iframe foi escondido (reabrir reinjeta a credencial). */
  needsRejoin: boolean;
  /** Aviso que não impede a chamada (sem câmera, conexão caindo). */
  notice: string | null;
}
