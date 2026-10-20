export type TwoFactorStatus = {
  emailVerified: boolean;
  totpEnabled: boolean;
  emailOtpEnabled: boolean;
  providerSecondFactor: boolean;
  twoFactorEnabled: boolean;
  identityVerified: boolean;
  backupCodesLeft: number;
  totpAvailable: boolean;
};
