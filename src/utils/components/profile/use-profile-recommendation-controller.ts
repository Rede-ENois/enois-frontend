import type { Profile } from "@/types/application/profile/profile";

import { useAuth } from "@/lib/use-auth";

import { useCreateProfileRecommendation } from "@/utils/components/profile/use-create-profile-recommendation";
import { useProfileRecommendationFormState } from "@/utils/components/profile/use-profile-recommendation-form-state";

export function useProfileRecommendationController(user: Profile) {
  const { user: me } = useAuth();
  const form = useProfileRecommendationFormState();
  const recommendation = useCreateProfileRecommendation(user.id, form.comment, form.reset);

  return {
    visible: me?.id !== user.id,
    open: form.open,
    setOpen: form.setOpen,
    comment: form.comment,
    setComment: form.setComment,
    sending: recommendation.sending,
    sendDisabled: !form.comment.trim() || recommendation.sending,
    send: recommendation.send,
  };
}
