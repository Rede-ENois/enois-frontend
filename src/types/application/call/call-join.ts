import type { CallKind } from "./call-kind";
import type { CallModality } from "./call-modality";
import type { CallView } from "./call-view";

/** Credencial de entrada na sala: o token já vem assinado do servidor. */
export interface CallJoin {
  callId: string;
  kind: CallKind;
  modality: CallModality;
  host: string;
  tokenTtlSeconds: number;
  appId: string | null;
  room: string;
  jwt: string;
  call: CallView;
}
