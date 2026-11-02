/** Resposta de `POST /me/onboarding/complete`: o que de fato entrou (o resto já existia). */
export type OnboardingCompleteResult = {
  onboardingCompleted: boolean;
  joinedCommunityIds: string[];
  joinedGroupIds: string[];
  requestedUserIds: string[];
};
