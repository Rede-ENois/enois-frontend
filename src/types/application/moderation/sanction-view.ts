import type { SanctionDeadline } from "./sanction-deadline";
import type { SanctionEvidence } from "./sanction-evidence";

/** Sanção como o titular a vê (GET /me/sanctions). */
export type SanctionView = {
  id: string;
  userId: string;
  reportId: string | null;
  type: "RESTRICTION" | "SUSPENDED" | "BAN" | "PERMABAN";
  reason: string | null;
  status: "ACTIVE" | "REMOVED";
  createdAt: string;
  removedAt: string | null;
  deadline: SanctionDeadline;
  evidence: SanctionEvidence;
  canAppeal: boolean;
  /** Campo de compatibilidade da QA; a apresentação usa o significado explícito de deadline. */
  dueAt?: string | null;
};
