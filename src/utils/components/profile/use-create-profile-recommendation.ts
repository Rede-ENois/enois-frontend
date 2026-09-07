import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createRecommendation } from "@/lib/api/recommendations/create-recommendation";

export function useCreateProfileRecommendation(
  userId: string,
  comment: string,
  onCreated: () => void,
) {
  const queryClient = useQueryClient();
  const recommendation = useMutation({
    mutationFn: () => createRecommendation(userId, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", userId] });
      onCreated();
    },
  });

  return {
    sending: recommendation.isPending,
    send: () => recommendation.mutate(),
  };
}
