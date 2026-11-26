import type { WrappedRetrospectiva } from "./wrapped-retrospectiva.js";
import type { WrappedStatus } from "./wrapped-status.js";

/** A resposta de GET /wrapped/{ano}: o status e, quando READY, a retrospectiva. */
export type WrappedResposta = {
  status: WrappedStatus;
  retrospectiva: WrappedRetrospectiva | null;
  dadosInsuficientes: boolean | null;
};
