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
  /**
   * O servidor respondeu que as chamadas ainda não estão ligadas neste ambiente
   * (`CALLS_NOT_CONFIGURED`). O painel mostra o aviso amigável em vez da tela de erro.
   */
  notConfigured: boolean;
  /** O painel está aberto mas o iframe foi escondido (reabrir reinjeta a credencial). */
  needsRejoin: boolean;
  /**
   * Pedido de credencial nova, feito pela tela (reabriu do canto, perdendo a mídia). O provider
   * consome e zera: sem isso, cada resposta do servidor poderia rearmar o pedido e a entrada
   * seria pedida de novo indefinidamente.
   */
  needsCredential: boolean;
  /** Aviso que não impede a chamada (sem câmera, conexão caindo). */
  notice: string | null;
}
