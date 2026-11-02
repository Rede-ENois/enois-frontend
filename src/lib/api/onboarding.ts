import type { OnboardingCompleteInput } from "@/types/application/onboarding/onboarding-complete-input";
import type { OnboardingCompleteResult } from "@/types/application/onboarding/onboarding-complete-result";
import type { StarterPack } from "@/types/application/onboarding/starter-pack";

import { api } from "../api-client";

export const onboardingApi = {
  /** Comunidades, grupos e pessoas que combinam com os assuntos e habilidades escolhidos. */
  starterPack: (topics: string[], skills: string[]) => {
    const params = new URLSearchParams();
    if (topics.length) params.set("topics", topics.join(","));
    if (skills.length) params.set("skills", skills.join(","));
    const query = params.toString();
    return api.get<StarterPack>(`/me/onboarding/starter-pack${query ? `?${query}` : ""}`);
  },

  /** Salva as escolhas, entra nas comunidades e grupos e pede as conexões marcadas. */
  complete: (data: OnboardingCompleteInput) =>
    api.post<OnboardingCompleteResult>("/me/onboarding/complete", data),

  /** Marca o onboarding como visto sem escolher nada. */
  skip: () => api.post<void>("/me/onboarding/skip"),
};
