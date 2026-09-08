import type { Mentor } from "@/types/application/mentor/mentor";

export type MentorCardContextValue = {
  mentor: Mentor;
  isOwner: boolean;
  avatar: string | null;
  name: string;
  profileUsername: string;
  headline: string;
};
