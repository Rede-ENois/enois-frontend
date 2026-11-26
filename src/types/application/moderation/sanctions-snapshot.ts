import type { MySanctionsResponse } from "./my-sanctions-response";

/** Snapshot local da consulta; observedAt nunca vem do payload do servidor. */
export type SanctionsSnapshot = {
  response: MySanctionsResponse;
  observedAt: number;
};
