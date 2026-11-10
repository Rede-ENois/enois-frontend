import type { IdentityState } from "./identity-state";

export type IdentityStatus = {
  state: IdentityState;
  verified: boolean;
  providerAvailable: boolean;
  provider: string | null;
  reasonCode: string | null;
  completedAt: string | null;
  /**
   * A vez da pessoa chegou: o convite da rodada de liberação progressiva. Sem convite, a tela
   * mostra "está chegando" e nenhum botão.
   */
  released: boolean;
  /** Resumo do backend: `UNAVAILABLE`, `WAITING` ou `RELEASED`. */
  releaseStatus: string | null;
};
