import type { TwoFactorMethod } from "./two-factor-method";

export type TwoFactorChallenge = {
  twoFactorRequired: true;
  challengeId: string;
  method: TwoFactorMethod;
  expiresAt: string;
};
