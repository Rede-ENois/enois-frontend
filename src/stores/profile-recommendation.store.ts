import { PROFILE_RECOMMENDATION_INITIAL_STATE } from "@/constants/profile-recommendation-initial-state";
import type { ProfileRecommendationStore } from "@/types/stores/profile-recommendation-store";
import { create } from "zustand";

export const useProfileRecommendationStore = create<ProfileRecommendationStore>()((set) => ({
  ...PROFILE_RECOMMENDATION_INITIAL_STATE,
  openForUser: (targetUserId) =>
    set({
      ...PROFILE_RECOMMENDATION_INITIAL_STATE,
      open: true,
      targetUserId,
    }),
  close: () => set(PROFILE_RECOMMENDATION_INITIAL_STATE),
  setComment: (comment) => set({ comment }),
}));
