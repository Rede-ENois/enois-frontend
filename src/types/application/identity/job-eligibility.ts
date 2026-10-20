export type JobEligibility = {
  allowed: boolean;
  reputation: number;
  requiredReputation: number;
  identityVerified: boolean;
  identityEnforced: boolean;
  reason: string | null;
};
