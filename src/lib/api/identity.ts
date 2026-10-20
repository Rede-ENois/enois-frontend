import type { IdentityStatus } from "@/types/application/identity/identity-status";
import type { JobEligibility } from "@/types/application/identity/job-eligibility";

import { api } from "../api-client";

export const identityApi = {
  /** Estado da verificação de identidade civil do próprio usuário. */
  status: () => api.get<IdentityStatus>("/identity"),

  /** Inicia a verificação (503 quando não há provedor autorizado configurado). */
  start: (consentVersion: string) =>
    api.post<{ attemptId: string; redirectUrl: string }>("/identity/verification", {
      consentVersion,
    }),

  /** Consulta o provedor e aplica o desfecho confirmado. */
  refresh: () => api.post<IdentityStatus>("/identity/verification/refresh"),

  /** Desvincula a identidade (volta a não verificada). */
  revoke: () => api.delete<IdentityStatus>("/identity/verification"),

  /** Elegibilidade para publicar vaga (a decisão final é sempre do backend). */
  eligibility: () => api.get<JobEligibility>("/identity/eligibility"),
};
