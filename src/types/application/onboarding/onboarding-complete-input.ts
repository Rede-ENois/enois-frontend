/** Corpo de `POST /me/onboarding/complete`: as escolhas da pessoa nos dois passos. */
export type OnboardingCompleteInput = {
  topics: string[];
  skills: string[];
  communityIds: string[];
  groupIds: string[];
  connectUserIds: string[];
};
