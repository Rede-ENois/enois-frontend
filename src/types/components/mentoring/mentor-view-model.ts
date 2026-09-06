import type { Mentor, Profile } from "@/lib/api";

export type MentorViewModel = {
  mentor: Mentor;
  user?: Profile;
  isOwner: boolean;
};
