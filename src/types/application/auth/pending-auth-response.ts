import type { TwoFactorChallenge } from "./two-factor-challenge";

export type PendingAuthResponse = {
  expiresAt: null;
  refreshExpiresAt: null;
  user: null;
  accessScope: null;
  twoFactor: Omit<TwoFactorChallenge, "twoFactorRequired">;
};
