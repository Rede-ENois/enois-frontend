import type { IdentityReleasePolicy } from "@/types/application/identity/identity-release-policy";
import type { IdentityReleaseRound } from "@/types/application/identity/identity-release-round";

/**
 * Visão da administração da liberação da verificação de identidade
 * (`GET /admin/identity/release`).
 *
 * <p>O front só lê e opera a fila: dar o selo a alguém não é uma ação que existe.</p>
 */
export type IdentityReleaseAdminOverview = {
  totalUsers: number;
  releasedUsers: number;
  inFlight: number;
  startedThisCycle: number;
  remainingCapacity: number;
  estimatedSpentUsd: string;
  budgetUsd: string;
  monthlyLimit: number;
  policy: IdentityReleasePolicy;
  lastRound: IdentityReleaseRound | null;
  providerAvailable: boolean;
};
