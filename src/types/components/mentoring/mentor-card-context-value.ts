import type { Mentor } from "@/types/application/mentor/mentor";
import type { Profile } from "@/types/application/profile/profile";

export type MentorCardContextValue = {
  mentor: Mentor;
  user?: Profile;
  isOwner: boolean;
};
