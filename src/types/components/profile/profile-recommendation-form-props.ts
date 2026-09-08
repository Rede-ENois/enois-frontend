import type { ProfileRecommendationDialogProps } from "@/types/components/profile/profile-recommendation-dialog-props";

export type ProfileRecommendationFormProps = Pick<
  ProfileRecommendationDialogProps,
  "comment" | "onCommentChange" | "sending" | "sendDisabled" | "onSend"
>;
