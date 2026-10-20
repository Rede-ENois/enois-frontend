import type { IdentityState } from "./identity-state";

export type IdentityStatus = {
  state: IdentityState;
  verified: boolean;
  providerAvailable: boolean;
  provider: string | null;
  reasonCode: string | null;
  completedAt: string | null;
};
