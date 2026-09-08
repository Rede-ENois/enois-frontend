import type { Profile } from "@/types/application/profile/profile";

export type AuthenticatedAppHeaderActionsProps = {
  profile: Profile | null;
  showProfile: boolean;
};
