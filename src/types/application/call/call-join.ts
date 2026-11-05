import type { CallKind } from "./call-kind";
import type { CallModality } from "./call-modality";
import type { CallView } from "./call-view";

/** Credencial de entrada na sala: o token já vem assinado do servidor. */
export interface CallJoin {
  callId: string;
  kind: CallKind;
  modality: CallModality;
  /** Origem do Jitsi que a gente hospeda, com https e sem barra no fim. */
  host: string;
  tokenTtlSeconds: number;
  room: string;
  jwt: string;
  call: CallView;
}
