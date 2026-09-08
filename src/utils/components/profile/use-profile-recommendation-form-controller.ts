import type { ChangeEvent } from "react";

import { useProfileRecommendationStore } from "@/stores/profile-recommendation.store";
import { useCreateProfileRecommendation } from "@/utils/components/profile/use-create-profile-recommendation";

export function useProfileRecommendationFormController() {
  const comment = useProfileRecommendationStore((state) => state.comment);
  const setComment = useProfileRecommendationStore((state) => state.setComment);
  const recommendation = useCreateProfileRecommendation();

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setComment(event.target.value);
  };

  return {
    comment,
    handleCommentChange,
    sending: recommendation.sending,
    sendDisabled: recommendation.sendDisabled,
    send: recommendation.send,
  };
}
