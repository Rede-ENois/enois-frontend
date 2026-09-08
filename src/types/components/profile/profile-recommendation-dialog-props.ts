import type { Profile } from "@/types/application/profile/profile";

export type ProfileRecommendationDialogProps = {
  user: Pick<Profile, "id" | "name">;
};
