import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createRecommendation } from "@/lib/api/recommendations/create-recommendation";
import { useProfileRecommendationStore } from "@/stores/profile-recommendation.store";

export function useCreateProfileRecommendation() {
  const queryClient = useQueryClient();
  const targetUserId = useProfileRecommendationStore((state) => state.targetUserId);
  const comment = useProfileRecommendationStore((state) => state.comment);
  const close = useProfileRecommendationStore((state) => state.close);

  const recommendation = useMutation({
    mutationFn: () => {
      if (!targetUserId) throw new Error("Missing recommendation target user");
      return createRecommendation(targetUserId, { comment });
    },
    onSuccess: () => {
      if (targetUserId) {
        queryClient.invalidateQueries({ queryKey: ["recommendations", targetUserId] });
      }
      close();
    },
  });

  return {
    sending: recommendation.isPending,
    sendDisabled: !targetUserId || !comment.trim() || recommendation.isPending,
    send: () => recommendation.mutate(),
  };
}
